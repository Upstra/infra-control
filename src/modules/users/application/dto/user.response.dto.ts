import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEmail, IsBoolean, IsDate } from 'class-validator';

import { User } from '../../domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty() @IsUUID() readonly id: string;
  @ApiProperty() @IsString() readonly username: string;
  @ApiProperty() @IsString() readonly firstName: string;
  @ApiProperty() @IsString() readonly lastName: string;
  @ApiProperty() @IsEmail() readonly email: string;

  @ApiProperty() @IsUUID() readonly roleId: string;

  @ApiProperty() @IsBoolean() readonly active: boolean;
  @ApiProperty() @IsBoolean() readonly isTwoFactorEnabled: boolean;

  @ApiProperty() @IsDate() readonly createdAt: Date;
  @ApiProperty() @IsDate() readonly updatedAt: Date;

  constructor(u: User) {
    this.id = u.id;
    this.username = u.username;
    this.firstName = u.firstName;
    this.lastName = u.lastName;
    this.email = u.email;
    this.roleId = u.roleId;
    this.active = u.active;
    this.isTwoFactorEnabled = u.isTwoFactorEnabled;
    this.createdAt = u.createdAt;
    this.updatedAt = u.updatedAt;
  }

  toUser(): User {
    const user = new User();
    user.id = this.id;
    user.username = this.username;
    user.firstName = this.firstName;
    user.lastName = this.lastName;
    user.email = this.email;
    user.roleId = this.roleId;
    user.active = this.active;
    user.isTwoFactorEnabled = this.isTwoFactorEnabled;
    user.createdAt = this.createdAt;
    user.updatedAt = this.updatedAt;
    return user;
  }
}
