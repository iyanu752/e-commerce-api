/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Product } from '../../schemas/product.schema';
import {
  CreateProductDto,
  UpdateProductDto,
  FilterProductDto,
} from './dto/product.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { Types } from 'mongoose';
@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    userId: string,
  ): Promise<Product> {
    const product = await this.productModel.create({
      ...createProductDto,
      createdBy: new Types.ObjectId(userId),
    });

    await this.invalidateProductCache();

    return product;
  }

  async findAll(
    filterDto: FilterProductDto,
  ): Promise<PaginatedResponseDto<Product>> {
    const {
      category,
      minPrice,
      maxPrice,
      search,
      cursor,
      limit = 10,
    } = filterDto;

    const cacheKey = `products:${JSON.stringify(filterDto)}`;

    const cached =
      await this.cacheManager.get<PaginatedResponseDto<Product>>(cacheKey);
    if (cached) {
      return cached;
    }

    const query: any = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (cursor) {
      query._id = { $gt: cursor };
    }

    const products = await this.productModel
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      .find(query)
      .sort({ _id: 1 })
      .limit(limit + 1)
      .exec();

    const hasMore = products.length > limit;
    const data = hasMore ? products.slice(0, -1) : products;
    const nextCursor = hasMore
      ? data[data.length - 1]._id.toString()
      : undefined;

    const result = {
      data,
      pagination: {
        nextCursor,
        hasMore,
      },
    };

    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  async findOne(id: string): Promise<Product> {
    const cacheKey = `product:${id}`;
    const cached = await this.cacheManager.get<Product>(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.cacheManager.set(cacheKey, product, 600);

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.invalidateProductCache();
    await this.cacheManager.del(`product:${id}`);

    return product;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Product not found');
    }

    await this.invalidateProductCache();
    await this.cacheManager.del(`product:${id}`);
  }

  private async invalidateProductCache(): Promise<void> {
    type StoreWithKeys = {
      keys?: (pattern?: string) => Promise<string[]>;
    };

    for (const store of this.cacheManager.stores) {
      const typedStore = store as StoreWithKeys;

      if (!typedStore.keys) continue;

      const keys = await typedStore.keys('products:*');
      for (const key of keys) {
        await this.cacheManager.del(key);
      }
    }
  }

  async updateStock(productId: string, quantity: number): Promise<void> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    product.stock -= quantity;
    await product.save();

    await this.cacheManager.del(`product:${productId}`);
  }
}
