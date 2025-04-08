import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { User } from '@/modules/users/domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly username: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly roleId: string;

  constructor(user: User) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.roleId = user.roleId;
  }

  toUser(): User {
    const user = new User();
    user.id = this.id;
    user.username = this.username;
    user.email = this.email;
    user.roleId = this.roleId;
    return user;
  }
}
