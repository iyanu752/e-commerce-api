import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderStatus } from '../../schemas/order.schema';
import { Cart } from '../../schemas/cart.schema';
import { Product } from '../../schemas/product.schema';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const cart = await this.cartModel
      .findOne({ user: userId })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }
    for (const item of cart.items) {
      const product = await this.productModel.findById(item.product._id);
      if (!product || product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product: ${(item.product as Product).name ?? '[Unknown Product]'}`,
        );
      }
    }
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      productName: (item.product as Product).name ?? '[Unknown Product]',
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    }));

    const order = await this.orderModel.create({
      orderNumber,
      user: new Types.ObjectId(userId),
      items: orderItems,
      totalAmount: cart.totalAmount,
      shippingAddress: createOrderDto.shippingAddress,
      notes: createOrderDto.notes,
      status: OrderStatus.PENDING,
    });

    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    const populatedOrder = await this.orderModel
      .findById(order._id)
      .populate('items.product')
      .exec();

    if (!populatedOrder) {
      throw new NotFoundException('Order not found');
    }

    return populatedOrder;
  }

  async findAll(
    userId: string,
    cursor?: string,
    limit = 10,
  ): Promise<PaginatedResponseDto<Order>> {
    const query: Record<string, unknown> = {
      user: new Types.ObjectId(userId),
    };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const orders = await this.orderModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('items.product')
      .exec();

    const hasMore = orders.length > limit;
    const data = hasMore ? orders.slice(0, -1) : orders;

    const nextCursor = hasMore
      ? data[data.length - 1]._id.toString()
      : undefined;

    return {
      data,
      pagination: { hasMore, nextCursor },
    };
  }

  async findOne(id: string, userId: string): Promise<Order> {
    const order = await this.orderModel
      .findOne({ _id: id, user: userId })
      .populate('items.product')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.orderModel
      .findByIdAndUpdate(
        id,
        { status: updateOrderStatusDto.status },
        { new: true },
      )
      .populate('items.product')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getAllOrders(
    cursor?: string,
    limit: number = 10,
  ): Promise<PaginatedResponseDto<Order>> {
    const query: Record<string, unknown> = {};

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const orders = await this.orderModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('items.product')
      .populate('user', 'name email')
      .exec();

    const hasMore = orders.length > limit;
    const data = hasMore ? orders.slice(0, -1) : orders;
    const nextCursor = hasMore
      ? data[data.length - 1]._id.toString()
      : undefined;

    return {
      data,
      pagination: {
        nextCursor,
        hasMore,
      },
    };
  }
}
