import { OrderType } from '../enums/order-type.enum';

import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class PortfolioDto {
  @IsString({ message: 'Stock symbol is required' })
  symbol!: string;

  @IsOptional()
  @IsNumber({}, { message: 'allocationPercentage must be a number' })
  @Min(0, { message: 'allocationPercentage cannot be negative' })
  @Max(100, { message: 'allocationPercentage cannot exceed 100' })
  allocationPercentage?: number;

  @IsOptional()
  @IsNumber({}, { message: 'sharePrice must be a number' })
  sharePrice?: number;
}

export class CreateOrderDto {
  @IsString({ message: 'userId is required' })
  userId!: string;

  @IsEnum(OrderType, { message: 'orderType must be BUY or SELL' })
  orderType!: OrderType;

  @IsNumber({}, { message: 'totalAmount must be a number' })
  totalAmount!: number;

  @IsArray({ message: 'portfolio must be an array' })
  @ArrayMinSize(1, { message: 'portfolio must contain at least one stock' })
  @ValidateNested({ each: true })
  @Type(() => PortfolioDto)
  portfolio!: PortfolioDto[];
}
