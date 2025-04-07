import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './application/controllers/user.controller';
import { UserService } from './application/services/user.service';
import { User } from './domain/entities/user.entity';
import { UserTypeormRepository } from './infrastructure/repositories/user.typeorm.repository';

@Module({
  controllers: [UserController],
  exports: [UserService],
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    UserService,
    {
      provide: 'UserRepositoryInterface',
      useClass: UserTypeormRepository,
    },
  ],
})
export class UserModule {}
