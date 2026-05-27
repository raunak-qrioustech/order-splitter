import { BadRequestException, Injectable } from '@nestjs/common';
import { PortfolioDto } from '../dto/create-order.dto';

@Injectable()
export class PortfolioAllocationService {
  constructor() {}

  preparePortfolio(portfolio: PortfolioDto[]): PortfolioDto[] {
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

    return normalizedPortfolio;
  }
}
