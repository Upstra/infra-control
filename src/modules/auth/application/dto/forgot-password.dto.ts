import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'john@example.com',
    required: true,
  })
  @IsNotEmpty({ message: "L'adresse email est requise" })
  @IsEmail({}, { message: "L'adresse email n'est pas valide" })
  readonly email: string;
}
