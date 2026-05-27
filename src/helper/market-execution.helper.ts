import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
@Injectable()
export class MarketExecutionService {
  constructor(private readonly configService: ConfigService) {}

  getExecutionWindow() {
    const timezone =
      this.configService.get<string>('MARKET_TIMEZONE') ?? 'America/New_York';

    const marketOpenHour =
      this.configService.get<number>('MARKET_OPEN_HOUR') ?? 9;

    const marketOpenMinute =
      this.configService.get<number>('MARKET_OPEN_MINUTE') ?? 30;

    const marketCloseHour =
      this.configService.get<number>('MARKET_CLOSE_HOUR') ?? 16;

    const marketCloseMinute =
      this.configService.get<number>('MARKET_CLOSE_MINUTE') ?? 0;

    if (marketOpenHour < 0 || marketOpenHour > 23) {
      throw new Error('Invalid MARKET_OPEN_HOUR');
    }

    const now = DateTime.now().setZone(timezone);
    if (!now.isValid) {
      throw new Error('Invalid market timezone');
    }
    const marketOpen: DateTime = now.set({
      hour: marketOpenHour,
      minute: marketOpenMinute,
      second: 0,
      millisecond: 0,
    });

    const marketClose: DateTime = now.set({
      hour: marketCloseHour,
      minute: marketCloseMinute,
      second: 0,
      millisecond: 0,
    });
    const isWeekend = now.weekday > 5;
    const isMarketOpen = !isWeekend && now >= marketOpen && now <= marketClose;

    if (isMarketOpen) {
      return {
        isMarketOpen: true,
        executionDate: now.toJSDate(),
        message: 'Market is currently open',
      };
    }

    let nextExecution = marketOpen;

    if (isWeekend) {
      const daysToMonday = 8 - now.weekday;

      nextExecution = marketOpen.plus({
        days: daysToMonday,
      });
    } else if (now > marketClose) {
      nextExecution = marketOpen.plus({
        days: 1,
      });

      if (nextExecution.weekday > 5) {
        nextExecution = nextExecution.plus({
          days: 8 - nextExecution.weekday,
        });
      }
    }

    return {
      isMarketOpen: false,
      executionDate: nextExecution.toJSDate(),
      message: `Market is closed. It reopens on ${nextExecution.toFormat(
        'dd LLL yyyy, hh:mm a',
      )}`,
    };
  }
}
