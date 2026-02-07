import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartItem } from '../../schemas/cart.schema';
import { Product } from '../../schemas/product.schema';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartModel
      .findOne({ user: userId })
      .populate('items.product')
      .exec();

    if (!cart) {
      cart = await this.cartModel.create({
        user: new Types.ObjectId(userId),
        items: [],
        totalAmount: 0,
      });
    }

    return cart;
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
    const { productId, quantity } = addToCartDto;

    const product = await this.productModel.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or inactive');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    let cart = await this.cartModel.findOne({ user: userId });
    if (!cart) {
      cart = await this.cartModel.create({
        user: new Types.ObjectId(userId),
        items: [],
        totalAmount: 0,
      });
    }

    const existingItemIndex = cart.items.findIndex((item) => {
      const productIdInCart =
        item.product instanceof Types.ObjectId
          ? item.product.toString()
          : item.product._id.toString();
      return productIdInCart === productId;
    });

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      if (product.stock < newQuantity) {
        throw new BadRequestException('Insufficient stock');
      }

      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({
        product: new Types.ObjectId(productId),
        quantity,
        price: product.price,
      } as CartItem);
    }

    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    await cart.save();

    const updatedCart = await this.cartModel
      .findById(cart._id)
      .populate('items.product')
      .exec();

    if (!updatedCart) {
      throw new NotFoundException('Cart not found after update');
    }

    return updatedCart;
  }

  async updateCartItem(
    userId: string,
    productId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<Cart> {
    const { quantity } = updateCartItemDto;

    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = cart.items.findIndex((item) => {
      const productIdInCart =
        item.product instanceof Types.ObjectId
          ? item.product.toString()
          : item.product._id.toString();
      return productIdInCart === productId;
    });

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    cart.items[itemIndex].quantity = quantity;

    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    await cart.save();

    const updatedCart = await this.cartModel
      .findById(cart._id)
      .populate('items.product')
      .exec();

    if (!updatedCart) {
      throw new NotFoundException('Cart not found after update');
    }

    return updatedCart;
  }

  async removeFromCart(userId: string, productId: string): Promise<Cart> {
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    cart.items = cart.items.filter((item) => {
      const productIdInCart =
        item.product instanceof Types.ObjectId
          ? item.product.toString()
          : item.product._id.toString();
      return productIdInCart !== productId;
    });

    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    await cart.save();

    const updatedCart = await this.cartModel
      .findById(cart._id)
      .populate('items.product')
      .exec();

    if (!updatedCart) {
      throw new NotFoundException('Cart not found after update');
    }

    return updatedCart;
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartModel.findOneAndUpdate(
      { user: userId },
      { items: [], totalAmount: 0 },
    );
  }
}
