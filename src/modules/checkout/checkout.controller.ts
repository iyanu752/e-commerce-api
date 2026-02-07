import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { ProcessPaymentDto, PaymentResponseDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import * as currentUserInterface from 'src/common/interfaces/current-user.interface';

@ApiTags('Checkout')
@Controller('checkout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('payment')
  @ApiOperation({ summary: 'Process payment (Mock)' })
  @ApiResponse({
    status: 200,
    description: 'Payment processed',
    type: PaymentResponseDto,
  })
  async processPayment(
    @CurrentUser() user: currentUserInterface.CurrentUserPayload,
    @Body() processPaymentDto: ProcessPaymentDto,
  ) {
    return this.checkoutService.processPayment(user.id, processPaymentDto);
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
