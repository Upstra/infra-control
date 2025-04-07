import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RoleCreationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name!: string;
}
