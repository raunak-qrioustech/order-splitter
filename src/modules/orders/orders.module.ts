import { Module } from '@nestjs/common';
import { OrdersController } from './controllers/orders.controller';
import { OrdersService } from './services/orders.service';
import { OrdersRepository } from './repositories/orders.repository';
import { MarketExecutionService } from 'src/helper/market-execution.helper';
import { PortfolioAllocationService } from './services/portfolio-allocation.service';
import { OrderSplitterService } from './services/order-splitter.service';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersRepository,
    MarketExecutionService,
    PortfolioAllocationService,
    OrderSplitterService,
  ],
})
export class OrdersModule {}
