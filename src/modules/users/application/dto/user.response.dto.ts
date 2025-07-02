import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEmail,
  IsBoolean,
  IsDate,
  IsOptional,
} from 'class-validator';
import { User } from '../../domain/entities/user.entity';
import { RoleResponseDto } from '@/modules/roles/application/dto';

export class UserResponseDto {
  @ApiProperty() @IsUUID() readonly id: string;
  @ApiProperty() @IsString() readonly username: string;
  @ApiProperty() @IsString() readonly firstName: string;
  @ApiProperty() @IsString() readonly lastName: string;
  @ApiProperty() @IsEmail() readonly email: string;

  @ApiProperty() @IsBoolean() readonly active: boolean;
  @ApiProperty() @IsBoolean() readonly isTwoFactorEnabled: boolean;

  @ApiProperty() @IsDate() readonly createdAt: Date;
  @ApiProperty() @IsDate() readonly updatedAt: Date;

  @ApiProperty({ type: [RoleResponseDto] }) readonly roles: RoleResponseDto[];

  constructor(u: User) {
    this.id = u.id;
    this.username = u.username;
    this.firstName = u.firstName;
    this.lastName = u.lastName;
    this.email = u.email;
    this.active = u.active;
    this.isTwoFactorEnabled = u.isTwoFactorEnabled;
    this.createdAt = u.createdAt;
    this.updatedAt = u.updatedAt;
    this.roles = u.roles?.map((role) => new RoleResponseDto(role)) ?? [];
  }

  toUser(): User {
    const user = new User();
    user.id = this.id;
    user.username = this.username;
    user.firstName = this.firstName;
    user.lastName = this.lastName;
    user.email = this.email;
    user.active = this.active;
    user.isTwoFactorEnabled = this.isTwoFactorEnabled;
    user.createdAt = this.createdAt;
    user.updatedAt = this.updatedAt;
    return user;
  }
}
