import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './application/user.controller';
import { UserService } from './application/user.service';
import { User } from './domain/entities/user.entity';
import { UserDomainService } from './domain/services/user.domain.service';
import { UserTypeormRepository } from './infrastructure/repositories/user.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [
    UserService,
    UserDomainService,
    {
      provide: 'UserRepositoryInterface',
      useClass: UserTypeormRepository,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
