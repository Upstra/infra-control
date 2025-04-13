import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  username: string;
  @ApiProperty({
    description: 'Password of the user',
    example: 'Password123?',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
