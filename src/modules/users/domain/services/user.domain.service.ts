import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

@Injectable()
export class UserDomainService {
  async validatePassword(user: User, plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, user.password);
  }

  isTwoFactorEnabled(user: User): boolean {
    return user.isTwoFactorEnabled;
  }
  async createUser(
    username: string,
    password: string,
    email: string,
    roleId: number,
    firstName?: string,
    lastName?: string,
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User();
    user.username = username;
    user.password = hashedPassword;
    user.email = email.toLowerCase();
    user.roleId = roleId;
    user.firstName = firstName ?? '';
    user.lastName = lastName ?? '';
    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.createdAt = new Date();
    user.updatedAt = new Date();

    return user;
  }
}