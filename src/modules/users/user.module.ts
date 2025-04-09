import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './application/controllers/user.controller';
import { UserService } from './application/services/user.service';
import { User } from './domain/entities/user.entity';
import { UserTypeormRepository } from './infrastructure/repositories/user.typeorm.repository';
import { UserDomainService } from './domain/services/user.domain.service';
import { RoleModule } from '../roles/role.module';

@Module({
  controllers: [UserController],
  exports: [UserService, UserDomainService],
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => RoleModule)],
  providers: [
    UserService,
    UserDomainService,
    {
      provide: 'UserRepositoryInterface',
      useClass: UserTypeormRepository,
    },
  ],
})
export class UserModule { }
