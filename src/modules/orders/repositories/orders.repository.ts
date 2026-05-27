import { Injectable } from '@nestjs/common';

import { OrderEntity } from '../entities/order.entity';

@Injectable()
export class OrdersRepository {
  private readonly orders: OrderEntity[] = [];

  create(order: OrderEntity): OrderEntity {
    this.orders.push(order);

    return order;
  }

  findAll(): OrderEntity[] {
    return this.orders;
  }
}
