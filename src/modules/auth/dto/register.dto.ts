import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsStrongPassword, IsEmail } from 'class-validator';
export class RegisterDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    required: true,
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    required: true,
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'john.doe@example.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
    required: true,
  })
  @IsString()
  username: string;
  @ApiProperty({
    description: 'Password of the user',
    example: 'password123',
    required: true,
  })
  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @ApiProperty({
    description: 'Password of the user',
    example: 'Password123?',
    required: true,
  })
  password: string;
}
