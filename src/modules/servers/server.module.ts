import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerController } from './application/server.controller';
import { ServerService } from './application/server.service';
import { Server } from './domain/entities/server.entity';
import { ServerDomainService } from './domain/services/server.domain.service';
import { ServerTypeormRepository } from './infrastructure/repositories/server.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Server])],
  controllers: [ServerController],
  providers: [
    ServerService,
    ServerDomainService,
    {
      provide: 'ServerRepositoryInterface',
      useClass: ServerTypeormRepository,
    },
  ],
  exports: [ServerService],
})
export class ServerModule {}
