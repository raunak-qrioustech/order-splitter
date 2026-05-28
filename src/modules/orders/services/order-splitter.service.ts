import { PortfolioDto } from '../dto/create-order.dto';
import Decimal from 'decimal.js';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStockEntity } from '../entities/order-stock.entity';

@Injectable()
export class OrderSplitterService {
  constructor(private readonly configService: ConfigService) {}

  calculateStocks(
    totalAmount: number,
    portfolio: PortfolioDto[],
  ): OrderStockEntity[] {
    const defaultStockPrice =
      this.configService.get<number>('DEFAULT_STOCK_VALUE') ?? 100;
    const decimalPlaces =
      this.configService.get<number>('SHARE_QUANTITY_DECIMAL_PLACES') ?? 3;
    const amountDecimalPlaces =
      this.configService.get<number>('FINAL_AMOUNT_DECIMAL_PLACES') ?? 6;

    const calculatedStocks = portfolio.map((stock) => {
      if (
        stock.allocationPercentage === undefined ||
        stock.allocationPercentage == 0
      ) {
        throw new BadRequestException(
          `Stock: ${stock.symbol} is not allocated by system`,
        );
      }

      const sharePrice = stock.sharePrice ?? defaultStockPrice;

      const allocatedAmount = (totalAmount * stock.allocationPercentage) / 100;

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
    });
    return calculatedStocks;
  }

  calculateTotals(totalAmount: number, calculatedStocks: OrderStockEntity[]) {
    const utilizedAmount = calculatedStocks
      .reduce(
        (sum, stock) => sum.plus(stock.finalAllocatedAmount),
        new Decimal(0),
      )
      .toNumber();
    const remainingAmount = new Decimal(totalAmount)
      .minus(utilizedAmount)
      .toNumber();
    return { utilizedAmount, remainingAmount };
  }
}
