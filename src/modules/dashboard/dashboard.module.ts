import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from '@/modules/dashboard/application/controllers/dashboard.controller';
import { DashboardService } from '@/modules/dashboard/domain/services/dashboard.service';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { Ups } from '@/modules/ups/domain/entities/ups.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Server, Ups])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
