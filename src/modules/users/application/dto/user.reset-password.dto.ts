import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsStrongPassword } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
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
  readonly newPassword: string;
}
