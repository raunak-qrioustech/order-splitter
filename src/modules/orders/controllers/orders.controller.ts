import { Body, Controller, Get, Post } from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderEntity } from '../entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private orderService: OrdersService) {}

  @Get()
  findAllOrders(): OrderEntity[] {
    return this.orderService.getAllOrders();
  }

  @Post()
  createOrder(@Body() createOrderDto: CreateOrderDto): OrderEntity {
    const result = this.orderService.createOrder(createOrderDto);
    return result;
  }
}
