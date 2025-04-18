import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Role } from '../../../roles/domain/entities/role.entity';

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
    const hashedPassword = await bcrypt.hash(password, 10);
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
}
