import {
  BadGatewayException,
  NotFoundException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderStatus, PaymentStatus } from '../../schemas/order.schema';
import { Product } from '../../schemas/product.schema';
import { User } from '../../schemas/user.schema';
import {
  InitializePaymentDto,
  InitializePaymentResponseDto,
  PaymentMethod,
  VerifyPaymentDto,
  VerifyPaymentResponseDto,
} from './dto/checkout.dto';

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    gateway_response?: string;
    paid_at?: string;
    paidAt?: string;
    channel?: string;
  };
};

@Injectable()
export class CheckoutService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {}

  async initializePayment(
    userId: string,
    initializePaymentDto: InitializePaymentDto,
  ): Promise<InitializePaymentResponseDto> {
    const { orderId, paymentMethod, callbackUrl } = initializePaymentDto;

    if (paymentMethod !== PaymentMethod.PAYSTACK) {
      throw new BadRequestException(
        'Only Paystack is supported in this template',
      );
    }

    const [order, user] = await Promise.all([
      this.orderModel.findOne({ _id: orderId, user: userId }),
      this.userModel.findById(userId),
    ]);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    await this.ensureStockAvailable(order);

    const reference =
      order.paymentReference ||
      `PSTK-${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`;

    const payload = {
      email: user.email,
      amount: this.toPaystackAmount(order.totalAmount),
      reference,
      currency: this.configService.get<string>('PAYSTACK_CURRENCY') || 'NGN',
      callback_url:
        callbackUrl || this.configService.get<string>('PAYSTACK_CALLBACK_URL'),
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId,
      },
    };

    const response = await this.callPaystack<PaystackInitializeResponse>(
      '/transaction/initialize',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );

    order.paymentStatus = PaymentStatus.PENDING;
    order.paymentMethod = paymentMethod;
    order.paymentProvider = PaymentMethod.PAYSTACK;
    order.paymentReference = response.data.reference;
    order.paymentAccessCode = response.data.access_code;
    order.transactionId = response.data.reference;
    await order.save();

    return {
      success: true,
      message: 'Paystack payment initialized successfully',
      paymentStatus: order.paymentStatus,
      provider: PaymentMethod.PAYSTACK,
      authorizationUrl: response.data.authorization_url,
      accessCode: response.data.access_code,
      reference: response.data.reference,
      transactionId: response.data.reference,
      order: await this.getPopulatedOrder(order._id.toString()),
    };
  }

  async verifyPayment(
    userId: string,
    verifyPaymentDto: VerifyPaymentDto,
  ): Promise<VerifyPaymentResponseDto> {
    const paymentMethod =
      verifyPaymentDto.paymentMethod || PaymentMethod.PAYSTACK;

    if (paymentMethod !== PaymentMethod.PAYSTACK) {
      throw new BadRequestException(
        'Only Paystack is supported in this template',
      );
    }

    const order = await this.orderModel.findOne({
      user: userId,
      paymentReference: verifyPaymentDto.reference,
    });

    if (!order) {
      throw new NotFoundException('Order not found for this payment reference');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return {
        success: true,
        message: 'Order payment is already verified',
        paymentStatus: order.paymentStatus,
        provider: PaymentMethod.PAYSTACK,
        reference: order.paymentReference,
        transactionId: order.transactionId,
        order: await this.getPopulatedOrder(order._id.toString()),
      };
    }

    const response = await this.callPaystack<PaystackVerifyResponse>(
      `/transaction/verify/${encodeURIComponent(verifyPaymentDto.reference)}`,
      {
        method: 'GET',
      },
    );

    const expectedAmount = this.toPaystackAmount(order.totalAmount);
    if (response.data.amount !== expectedAmount) {
      throw new BadRequestException(
        'Verified payment amount does not match the order total',
      );
    }

    order.paymentMethod = paymentMethod;
    order.paymentProvider = PaymentMethod.PAYSTACK;
    order.paymentReference = response.data.reference;
    order.transactionId = response.data.reference;

    if (response.data.status === 'success') {
      await this.ensureStockAvailable(order);
      await this.deductStock(order);

      order.paymentStatus = PaymentStatus.PAID;
      order.status = OrderStatus.CONFIRMED;
      order.paidAt = new Date(
        response.data.paid_at || response.data.paidAt || Date.now(),
      );
      await order.save();

      return {
        success: true,
        message:
          response.data.gateway_response || 'Payment verified successfully',
        paymentStatus: PaymentStatus.PAID,
        provider: PaymentMethod.PAYSTACK,
        reference: response.data.reference,
        transactionId: response.data.reference,
        order: await this.getPopulatedOrder(order._id.toString()),
      };
    }

    if (
      ['pending', 'ongoing', 'processing', 'queued'].includes(
        response.data.status,
      )
    ) {
      order.paymentStatus = PaymentStatus.PENDING;
      await order.save();

      return {
        success: false,
        message:
          response.data.gateway_response ||
          'Payment is still pending on Paystack',
        paymentStatus: PaymentStatus.PENDING,
        provider: PaymentMethod.PAYSTACK,
        reference: response.data.reference,
        transactionId: response.data.reference,
        order: await this.getPopulatedOrder(order._id.toString()),
      };
    }

    order.paymentStatus = PaymentStatus.FAILED;
    await order.save();

    return {
      success: false,
      message:
        response.data.gateway_response ||
        'Payment was not successful on Paystack',
      paymentStatus: PaymentStatus.FAILED,
      provider: PaymentMethod.PAYSTACK,
      reference: response.data.reference,
      transactionId: response.data.reference,
      order: await this.getPopulatedOrder(order._id.toString()),
    };
  }

  async getOrderStatus(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderModel
      .findOne({ _id: orderId, user: userId })
      .populate('items.product')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private async ensureStockAvailable(order: Order): Promise<void> {
    for (const item of order.items) {
      const product = await this.productModel.findById(item.product);
      if (!product || product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product: ${item.productName}`,
        );
      }
    }
  }

  private async deductStock(order: Order): Promise<void> {
    for (const item of order.items) {
      await this.productModel.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }
  }

  private async getPopulatedOrder(orderId: string): Promise<Order | null> {
    return this.orderModel.findById(orderId).populate('items.product').exec();
  }

  private toPaystackAmount(amount: number): number {
    return Math.round(amount * 100);
  }

  private async callPaystack<T>(path: string, init: RequestInit): Promise<T> {
    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');

    if (!secretKey) {
      throw new BadRequestException(
        'PAYSTACK_SECRET_KEY is required to initialize or verify payments',
      );
    }

    const baseUrl =
      this.configService.get<string>('PAYSTACK_BASE_URL') ||
      'https://api.paystack.co';

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });

    const payload = (await response.json()) as T & {
      status?: boolean;
      message?: string;
    };

    if (!response.ok || payload.status === false) {
      throw new BadGatewayException(
        payload.message || 'Paystack request failed',
      );
    }

    return payload;
  }
}
