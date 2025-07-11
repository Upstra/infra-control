import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IloCredentialsDto {
  @ApiProperty({ description: 'iLO username' })
  @IsString()
  user: string;

  @ApiProperty({ description: 'iLO password' })
  @IsString()
  password: string;
}