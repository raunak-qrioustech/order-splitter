import { BadRequestException, Injectable } from '@nestjs/common';
import { OrdersRepository } from '../repositories/orders.repository';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderEntity } from '../entities/order.entity';
import { OrderStockEntity } from '../entities/order-stock.entity';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import Decimal from 'decimal.js';
@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly configService: ConfigService,
  ) {}

  private getExecutionDate(): Date {
    const now = new Date();

    const day = now.getDay();

    if (day === 6) {
      now.setDate(now.getDate() + 2);
    }

    if (day === 0) {
      now.setDate(now.getDate() + 1);
    }

    return now;
  }
  createOrder(createOrderDto: CreateOrderDto): OrderEntity {
    const { userId, orderType, totalAmount, portfolio } = createOrderDto;

    // FETCHING ENV
    const defaultStockPrice =
      this.configService.get<number>('DEFAULT_STOCK_VALUE') ?? 100;
    const decimalPlaces =
      this.configService.get<number>('SHARE_QUANTITY_DECIMAL_PLACES') ?? 3;
    const amountDecimalPlaces =
      this.configService.get<number>('FINAL_AMOUNT_DECIMAL_PLACES') ?? 6;

    // Percentage Distribution
    const totalProvidedPercentage = portfolio
      .filter((stock) => stock.allocationPercentage !== undefined)
      .reduce((sum, stock) => sum + (stock.allocationPercentage ?? 0), 0);

    if (totalProvidedPercentage > 100) {
      throw new BadRequestException(
        'Total allocation percentage cannot exceed 100',
      );
    }
    const remainingPercentage = 100 - totalProvidedPercentage;

    // VALIDATION : Unique Symbol
    const symbols = portfolio.map((stock) => stock.symbol.toUpperCase());
    const uniqueSymbols = new Set(symbols);

    if (symbols.length !== uniqueSymbols.size) {
      throw new BadRequestException('Duplicate stock symbols are not allowed');
    }

    // Divide remaining percentage of TOTAL equally
    const missingAllocations = portfolio.filter(
      (stock) => stock.allocationPercentage === undefined,
    );

    const autoAllocation =
      missingAllocations.length > 0
        ? remainingPercentage / missingAllocations.length
        : 0;

    if (missingAllocations.length === 0 && totalProvidedPercentage !== 100) {
      throw new BadRequestException(
        'Total allocation percentage must equal 100',
      );
    }

    const normalizedPortfolio = portfolio.map((stock) => ({
      ...stock,
      allocationPercentage: stock.allocationPercentage ?? autoAllocation,
    }));

    const calculatedStocks: OrderStockEntity[] = normalizedPortfolio.map(
      (stock) => {
        const sharePrice = stock.sharePrice ?? defaultStockPrice;

        const allocatedAmount =
          (totalAmount * stock.allocationPercentage) / 100;

        const rawQuantity = allocatedAmount / sharePrice;

        const quantity = new Decimal(rawQuantity)
          .toDecimalPlaces(Number(decimalPlaces), Decimal.ROUND_DOWN)
          .toNumber();

        const finalAllocatedAmount = new Decimal(quantity)
          .mul(sharePrice)
          .toDecimalPlaces(Number(amountDecimalPlaces), Decimal.ROUND_DOWN)
          .toNumber();

        return {
          symbol: stock.symbol.toUpperCase(),
          allocationPercentage: stock.allocationPercentage,
          allocatedAmount,
          finalAllocatedAmount,
          sharePrice,
          quantity,
        };
      },
    );

    const utilizedAmount = calculatedStocks.reduce(
      (sum, stock) => sum.plus(stock.finalAllocatedAmount),
      new Decimal(0),
    );
    const remainingAmount = new Decimal(totalAmount).minus(utilizedAmount);

    const order: OrderEntity = {
      id: uuidv4(),
      userId,
      orderType,
      totalAmount,
      utilizedAmount: utilizedAmount.toNumber(),
      remainingAmount: remainingAmount.toNumber(),
      executionDate: this.getExecutionDate(),
      stocks: calculatedStocks,
      createdAt: new Date(),
    };

    return this.ordersRepository.create(order);
  }
  getAllOrders() {
    return this.ordersRepository.findAll();
  }
}
