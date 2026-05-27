import { Injectable } from '@nestjs/common';
import { OrdersRepository } from '../repositories/orders.repository';
import { CreateOrderDto, PortfolioDto } from '../dto/create-order.dto';
import { OrderEntity } from '../entities/order.entity';
import { v4 as uuidv4 } from 'uuid';
import { MarketExecutionService } from 'src/helper/market-execution.helper';
import { PortfolioAllocationService } from './portfolio-allocation.service';
import { OrderSplitterService } from './order-splitter.service';
@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly marketExecutionService: MarketExecutionService,
    private readonly portfolioAllocationService: PortfolioAllocationService,
    private readonly orderSplitterService: OrderSplitterService,
  ) {}

  createOrder(createOrderDto: CreateOrderDto): OrderEntity {
    const { userId, orderType, totalAmount, portfolio } = createOrderDto;

    const normalizedPortfolio: PortfolioDto[] =
      this.portfolioAllocationService.preparePortfolio(portfolio);

    const calculatedStocks = this.orderSplitterService.calculateStocks(
      totalAmount,
      normalizedPortfolio,
    );

    const financialSummary = this.orderSplitterService.calculateTotals(
      totalAmount,
      calculatedStocks,
    );

    const executionWindow = this.marketExecutionService.getExecutionWindow();

    const order: OrderEntity = {
      id: uuidv4(),
      userId,
      orderType,
      totalAmount,
      utilizedAmount: financialSummary.utilizedAmount,
      remainingAmount: financialSummary.remainingAmount,
      executionDate: executionWindow.executionDate,
      marketStatus: executionWindow.message,
      stocks: calculatedStocks,
      createdAt: new Date(),
    };

    return this.ordersRepository.create(order);
  }

  getAllOrders() {
    return this.ordersRepository.findAll();
  }
}
