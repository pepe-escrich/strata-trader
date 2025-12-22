import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BingxModule } from './modules/bingx/bingx.module';
import { MarketModule } from './modules/market/market.module';
import { SupportResistanceModule } from './modules/support-resistance/support-resistance.module';
import { DivergenceModule } from './modules/divergence/divergence.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { BacktestingModule } from './modules/backtesting/backtesting.module';
import { HistoryModule } from './modules/history/history.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import bingxConfig from './config/bingx.config';
import tradingConfig from './config/trading.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, bingxConfig, tradingConfig],
      envFilePath: '.env',
    }),

    // Database (MongoDB) - Optional for now
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        // Optional: uncomment when MongoDB is ready
        // user: configService.get<string>('database.user'),
        // pass: configService.get<string>('database.password'),
      }),
      inject: [ConfigService],
    }),

    BingxModule,

    MarketModule,

    SupportResistanceModule,

    DivergenceModule,

    OrdersModule,

    AlertsModule,

    BacktestingModule,

    HistoryModule,

    // Application Modules
    // TODO: Add feature modules here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
