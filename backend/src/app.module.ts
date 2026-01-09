import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BingxModule } from './modules/bingx/bingx.module';
import { TaapiModule } from './modules/taapi/taapi.module';
import { LevelsModule } from './modules/levels/levels.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import bingxConfig from './config/bingx.config';
import taapiConfig from './config/taapi.config';
import levelsConfig from './config/levels.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, bingxConfig, taapiConfig, levelsConfig],
      envFilePath: '.env',
    }),

    // Database (MongoDB)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),

    // BingX integration
    BingxModule,

    // TAAPI integration for technical analysis
    TaapiModule,

    // Levels persistence and management
    LevelsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
