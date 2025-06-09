import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './application/controllers/user.controller';
import { User } from './domain/entities/user.entity';
import { UserTypeormRepository } from './infrastructure/repositories/user.typeorm.repository';
import { UserDomainService } from './domain/services/user.domain.service';
import { RoleModule } from '../roles/role.module';
import { UserUseCase } from './application/use-cases';
import { SetupModule } from '../setup/setup.module';

@Module({
  controllers: [UserController],
  exports: [...UserUseCase, UserDomainService, 'UserRepositoryInterface'],
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => RoleModule),
    forwardRef(() => SetupModule),
  ],
  providers: [
    ...UserUseCase,
    UserDomainService,
    {
      provide: 'UserRepositoryInterface',
      useClass: UserTypeormRepository,
    },
  ],
})
export class UserModule {}
