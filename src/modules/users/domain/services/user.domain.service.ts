import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Role } from '../../../roles/domain/entities/role.entity';
import { UserUpdateDto } from '../../application/dto/user.update.dto';

@Injectable()
export class UserDomainService {
  async validatePassword(
    userPassword: string,
    plainPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, userPassword);
  }

  isTwoFactorEnabled(user: User): boolean {
    return user.isTwoFactorEnabled;
  }
  async createUserEntity(
    username: string,
    password: string,
    email: string,
    role: Role,
    firstName?: string,
    lastName?: string,
  ): Promise<User> {
    const hashedPassword = await this.hashPassword(password);
    const user = new User();
    user.username = username;
    user.password = hashedPassword;
    user.email = email.toLowerCase();
    user.role = role;
    user.firstName = firstName ?? '';
    user.lastName = lastName ?? '';
    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.createdAt = new Date();
    user.updatedAt = new Date();

    return user;
  }

  async updateUserEntity(user: User, dto: UserUpdateDto): Promise<User> {
    user.username = dto.username ?? user.username;
    user.firstName = dto.firstName ?? user.firstName;
    user.lastName = dto.lastName ?? user.lastName;
    user.email = dto.email?.toLowerCase() ?? user.email;
    user.roleId = dto.roleId ?? user.roleId;
    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }
    return user;
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
}
