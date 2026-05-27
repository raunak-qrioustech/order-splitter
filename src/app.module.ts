import { Module } from '@nestjs/common';
import { OrdersModule } from './modules/orders/orders.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    OrdersModule,
  ],
})
export class AppModule {}
