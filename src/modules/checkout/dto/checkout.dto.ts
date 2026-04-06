import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../../../schemas/order.schema';

export enum PaymentMethod {
  PAYSTACK = 'paystack',
}

export class InitializePaymentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  declare orderId: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  declare paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Optional frontend callback URL override for this payment',
  })
  @IsOptional()
  @IsString()
  callbackUrl?: string;
}

export class InitializePaymentResponseDto {
  @ApiProperty()
  declare success: boolean;

  @ApiProperty()
  declare message: string;

  @ApiProperty({ enum: PaymentStatus })
  declare paymentStatus: PaymentStatus;

  @ApiProperty()
  declare provider: string;

  @ApiProperty()
  declare authorizationUrl: string;

  @ApiProperty()
  declare accessCode: string;

  @ApiProperty()
  declare reference: string;

  @ApiProperty()
  declare transactionId: string;

  @ApiProperty()
  order: any;
}

export class VerifyPaymentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  declare reference: string;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.PAYSTACK })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}

export class VerifyPaymentResponseDto {
  @ApiProperty()
  declare success: boolean;

  @ApiProperty()
  declare message: string;

  @ApiProperty({ enum: PaymentStatus })
  declare paymentStatus: PaymentStatus;

  @ApiProperty()
  declare provider: string;

  @ApiProperty()
  declare reference: string;

  @ApiProperty()
  declare transactionId: string;

  @ApiProperty()
  order: any;
}
