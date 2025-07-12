import { Module } from '@nestjs/common';
import { PingController } from './application/controllers/ping.controller';
import { PingHostnameUseCase } from './application/use-cases/ping-hostname.use-case';
import { PingService } from './domain/services/ping.service';

@Module({
  controllers: [PingController],
  providers: [PingService, PingHostnameUseCase],
  exports: [PingService],
})
export class PingModule {}