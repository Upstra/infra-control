import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './application/controllers/role.controller';
import { RoleService } from './application/services/role.service';
import { Role } from './domain/entities/role.entity';
import { RoleTypeormRepository } from './infrastructure/repositories/role.typeorm.repository';

@Module({
  controllers: [RoleController],
  exports: [RoleService],
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [
    RoleService,
    {
      provide: 'RoleRepositoryInterface',
      useClass: RoleTypeormRepository,
    },
  ],
})
export class RoleModule {}
