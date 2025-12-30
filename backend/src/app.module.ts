import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BingxModule } from './modules/bingx/bingx.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import bingxConfig from './config/bingx.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, bingxConfig],
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
