import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Role } from '../../../roles/domain/entities/role.entity';
import { UserUpdateDto } from '../../application/dto/user.update.dto';
import { UserRepositoryInterface } from '../interfaces/user.repository.interface';
import { UserConflictException } from '../exceptions/user.exception';

@Injectable()
export class UserDomainService {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
  ) {}

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
    return user;
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async ensureUniqueEmail(email: string, userId: string): Promise<void> {
    await this.ensureUniqueField('email', email, userId);
  }

  async ensureUniqueUsername(username: string, userId: string): Promise<void> {
    await this.ensureUniqueField('username', username, userId);
  }

  async ensureUniqueField(
    field: string,
    value: string,
    userId: string,
  ): Promise<void> {
    const existing = await this.repo.findOneByField({
      field: field as keyof User,
      value: value,
      disableThrow: true,
    });
    if (existing && existing.id !== userId) {
      throw new UserConflictException(undefined, field as 'username' | 'email');
    }
  }
}
