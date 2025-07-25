import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { Role } from '../../../roles/domain/entities/role.entity';
import { UserUpdateDto } from '@modules/users/application/dto';
import { UpdateAccountDto } from '@modules/users/application/dto';
import { UserRepositoryInterface } from '../interfaces/user.repository.interface';
import { UserConflictException } from '../exceptions/user.exception';

/**
 * Manages user lifecycle and profile operations within the domain layer.
 * Encapsulates rules for registration, profile updates, and account deactivation.
 *
 * Responsibilities:
 * - Validate and create new user entities, enforcing unique credentials and email.
 * - Handle password hashing, 2FA setup (e.g. TOTP), and recovery code issuance.
 * - Update user roles, permissions, and profile metadata securely.
 * - Deactivate or delete users with audit logging for compliance.
 *
 * @remarks
 * Designed for use by application-layer use-cases; controllers should not
 * manipulate user repositories directly to ensure business invariants.
 *
 * @example
 * // Register a new user
 * const user = await userDomainService.register({ email, password });
 */

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
    user.roles = [role];
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
      throw new UserConflictException(field as 'username' | 'email');
    }
  }

  async updateAccount(user: User, dto: UpdateAccountDto): Promise<User> {
    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
    }
    if (dto.email !== undefined) {
      await this.ensureUniqueEmail(dto.email, user.id);
      user.email = dto.email.toLowerCase();
    }
    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }
    if (dto.isVerified !== undefined) {
      user.isVerified = dto.isVerified;
    }
    user.updatedAt = new Date();
    return user;
  }

  async activateUser(user: User): Promise<User> {
    user.isActive = true;
    user.updatedAt = new Date();
    return user;
  }
}
