import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerController } from './application/controllers/server.controller';
import { Server } from './domain/entities/server.entity';
import { ServerTypeormRepository } from './infrastructure/repositories/server.typeorm.repository';
import { IloModule } from '../ilos/ilo.module';
import { ServerDomainService } from './domain/services/server.domain.service';
import { ServerUseCases } from './application/use-cases';

@Module({
  controllers: [ServerController],
  exports: [...ServerUseCases],
  imports: [TypeOrmModule.forFeature([Server]), IloModule],
  providers: [
    ...ServerUseCases,
    ServerDomainService,
    {
      provide: 'ServerRepositoryInterface',
      useClass: ServerTypeormRepository,
    },
  ],
})
export class ServerModule {}
