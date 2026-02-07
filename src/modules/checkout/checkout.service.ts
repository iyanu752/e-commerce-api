/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderStatus, PaymentStatus } from '../../schemas/order.schema';
import { Product } from '../../schemas/product.schema';
import { ProcessPaymentDto, PaymentResponseDto } from './dto/checkout.dto';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async processPayment(
    userId: string,
    processPaymentDto: ProcessPaymentDto,
  ): Promise<PaymentResponseDto> {
    const { orderId, paymentMethod, paymentDetails } = processPaymentDto;

    const order = await this.orderModel.findOne({ _id: orderId, user: userId });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    for (const item of order.items) {
      const product = await this.productModel.findById(item.product);
      if (!product || product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product: ${item.productName}`,
        );
      }
    }

    const paymentResult = await this.mockPaymentGateway(
      order.totalAmount,
      paymentMethod,
      paymentDetails,
    );

    if (paymentResult.success) {
      order.paymentStatus = PaymentStatus.PAID;
      order.status = OrderStatus.CONFIRMED;
      order.paymentMethod = paymentMethod;
      order.transactionId = paymentResult.transactionId;
      await order.save();

      for (const item of order.items) {
        await this.productModel.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }

      return {
        success: true,
        transactionId: paymentResult.transactionId,
        paymentStatus: PaymentStatus.PAID,
        message: 'Payment processed successfully',
        order: await this.orderModel
          .findById(order._id)
          .populate('items.product'),
      };
    } else {
      order.paymentStatus = PaymentStatus.FAILED;
      await order.save();

      return {
        success: false,
        transactionId: paymentResult.transactionId,
        paymentStatus: PaymentStatus.FAILED,
        message: 'Payment failed: ' + paymentResult.message,
        order: await this.orderModel
          .findById(order._id)
          .populate('items.product'),
      };
    }
  }

  private async mockPaymentGateway(
    _amount: number,
    _paymentMethod: string,
    _paymentDetails: unknown,
  ): Promise<{ success: boolean; transactionId: string; message?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const isSuccess = Math.random() > 0.1;

    const transactionId = `TXN-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    return isSuccess
      ? { success: true, transactionId }
      : {
          success: false,
          transactionId,
          message: 'Insufficient funds or card declined',
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
}
