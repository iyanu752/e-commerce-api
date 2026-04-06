import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CheckoutModule } from './modules/checkout/checkout.module';

function getNumberConfig(
  configService: ConfigService,
  key: string,
  fallback: number,
): number {
  const value = configService.get<string>(key);
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: getNumberConfig(configService, 'THROTTLE_TTL', 60),
          limit: getNumberConfig(configService, 'THROTTLE_LIMIT', 10),
        },
      ],
      inject: [ConfigService],
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): Record<string, unknown> => {
        const ttl = getNumberConfig(configService, 'REDIS_TTL', 3600);
        const redisHost = configService.get<string>('REDIS_HOST');

        if (!redisHost) {
          return { ttl };
        }

        return {
          store: redisStore,
          host: redisHost,
          port: getNumberConfig(configService, 'REDIS_PORT', 6379),
          ttl,
        };
      },
      inject: [ConfigService],
    }),

    AuthModule,
    UserModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    CheckoutModule,
  ],
})
export class AppModule {}
