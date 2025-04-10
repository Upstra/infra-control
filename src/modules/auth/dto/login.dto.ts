import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsStrongPassword } from 'class-validator';
export class LoginDto {
  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
    required: true,
  })
  @IsString()
  username: string;
  @ApiProperty({
    description: 'Password of the user',
    example: 'Password123?',
    required: true,
  })
  @IsString()
  password: string;
}
