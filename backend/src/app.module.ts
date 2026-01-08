import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BingxModule } from './modules/bingx/bingx.module';
import { TaapiModule } from './modules/taapi/taapi.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import bingxConfig from './config/bingx.config';
import taapiConfig from './config/taapi.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, bingxConfig, taapiConfig],
      envFilePath: '.env',
    }),

    // Database (MongoDB) - Temporalmente deshabilitado
    // MongooseModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: async (configService: ConfigService) => ({
    //     uri: configService.get<string>('database.uri'),
    //   }),
    //   inject: [ConfigService],
    // }),

    // BingX integration
    BingxModule,

    // TAAPI integration for technical analysis
    TaapiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
