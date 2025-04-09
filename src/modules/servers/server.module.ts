import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerController } from './application/controllers/server.controller';
import { ServerService } from './application/services/server.service';
import { Server } from './domain/entities/server.entity';
import { ServerTypeormRepository } from './infrastructure/repositories/server.typeorm.repository';
import { IloModule } from '@/modules/ilos/ilo.module';
import { ServerDomainService } from './domain/services/server.domain.service';

@Module({
  controllers: [ServerController],
  exports: [ServerService],
  imports: [TypeOrmModule.forFeature([Server]), IloModule],
  providers: [
    ServerService,
    ServerDomainService,
    {
      provide: 'ServerRepositoryInterface',
      useClass: ServerTypeormRepository,
    },
  ],
})
export class ServerModule {}
