import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import {
  InitializePaymentDto,
  InitializePaymentResponseDto,
  VerifyPaymentDto,
  VerifyPaymentResponseDto,
} from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import * as currentUserInterface from '../../common/interfaces/current-user.interface';

@ApiTags('Checkout')
@Controller('checkout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('paystack/initialize')
  @ApiOperation({ summary: 'Initialize a Paystack payment for an order' })
  @ApiResponse({
    status: 201,
    description: 'Paystack payment initialized',
    type: InitializePaymentResponseDto,
  })
  async initializePayment(
    @CurrentUser() user: currentUserInterface.CurrentUserPayload,
    @Body() initializePaymentDto: InitializePaymentDto,
  ) {
    return this.checkoutService.initializePayment(
      user.id,
      initializePaymentDto,
    );
  }

  @Post('paystack/verify')
  @ApiOperation({
    summary: 'Verify a Paystack payment reference and update the order',
  })
  @ApiResponse({
    status: 200,
    description: 'Paystack payment verified',
    type: VerifyPaymentResponseDto,
  })
  async verifyPayment(
    @CurrentUser() user: currentUserInterface.CurrentUserPayload,
    @Body() verifyPaymentDto: VerifyPaymentDto,
  ) {
    return this.checkoutService.verifyPayment(user.id, verifyPaymentDto);
  }

  @Get('order/:orderId/status')
  @ApiOperation({ summary: 'Get order payment status' })
  @ApiResponse({ status: 200, description: 'Order payment status' })
  async getOrderStatus(
    @Param('orderId') orderId: string,
    @CurrentUser() user: currentUserInterface.CurrentUserPayload,
  ) {
    return this.checkoutService.getOrderStatus(orderId, user.id);
  }
}
