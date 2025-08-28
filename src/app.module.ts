import { Module } from '@nestjs/common';
import { MetricsModule } from './metrics/metrics.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import {MetricsController} from "./metrics/metrics.controller";
import {UsersController} from "./users/users.controller";
import { ReportsController } from "./reports/reports.controller";
import {MetricsService} from "./metrics/metrics.service";
import {ReportsService} from "./reports/reports.service";
import {UsersService} from "./users/users.service";

@Module({
  imports: [MetricsModule, UsersModule, ReportsModule],
  controllers: [MetricsController, UsersController, ReportsController],
  providers: [MetricsService, UsersService, ReportsService],
})
export class AppModule {}
