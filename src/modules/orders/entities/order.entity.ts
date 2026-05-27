import { OrderType } from '../enums/order-type.enum';
import { OrderStockEntity } from './order-stock.entity';

export class OrderEntity {
  id!: string;

  userId!: string;

  orderType!: OrderType;

  totalAmount!: number;

  utilizedAmount!: number;

  remainingAmount!: number;

  stocks!: OrderStockEntity[];

  executionDate?: Date;

  createdAt!: Date;
}
