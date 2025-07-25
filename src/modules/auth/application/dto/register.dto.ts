import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsStrongPassword, IsEmail, Length } from 'class-validator';
import { IsValidName } from '../../../../core/decorators/is-valid-name.decorator';

export class RegisterDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    required: true,
  })
  @IsString()
  @Length(2, 15)
  @IsValidName()
  readonly firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    required: true,
  })
  @IsString()
  @Length(2, 15)
  @IsValidName()
  readonly lastName: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'john.doe@example.com',
    required: true,
  })
  @IsEmail()
  readonly email: string;

  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
    required: true,
  })
  @IsString()
  @Length(3, 10)
  readonly username: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'Password123?',
    required: true,
  })
  @IsString()
  @IsStrongPassword(
    {
      minLength: 8,
      minUppercase: 1,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message: (args) => {
        return (
          `Le mot de passe doit contenir au moins ${args.constraints[0].minLength} caractères, ` +
          `${args.constraints[0].minUppercase} majuscule(s), ${args.constraints[0].minLowercase} minuscule(s), ` +
          `${args.constraints[0].minNumbers} chiffre(s), et ${args.constraints[0].minSymbols} symbole(s).`
        );
      },
    },
  )
  @ApiProperty({
    description: 'Password of the user',
    example: 'Password123?',
    required: true,
  })
  readonly password: string;
}
