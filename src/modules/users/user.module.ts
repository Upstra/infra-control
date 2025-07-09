import { forwardRef, Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './application/controllers/user.controller';
import { User } from './domain/entities/user.entity';
import { UserTypeormRepository } from './infrastructure/repositories/user.typeorm.repository';
import { UserDomainService } from './domain/services/user.domain.service';
import { RoleModule } from '../roles/role.module';
import { UserUseCase } from './application/use-cases';
import { SetupModule } from '../setup/setup.module';
import { AuditModule } from '../audit/audit.module';

@Global()
@Module({
  controllers: [UserController],
  exports: [
    ...UserUseCase,
    UserDomainService,
    'UserRepositoryInterface',
    UserTypeormRepository,
  ],
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => RoleModule),
    forwardRef(() => SetupModule),
    AuditModule,
  ],
  providers: [
    ...UserUseCase,
    UserDomainService,
    UserTypeormRepository,
    {
      provide: 'UserRepositoryInterface',
      useClass: UserTypeormRepository,
    },
  ],
})
export class UserModule {}
