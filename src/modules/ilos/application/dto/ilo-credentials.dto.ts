import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class IloCredentialsDto {
  @ApiProperty({ description: 'iLO username' })
  @IsString()
  user: string;

  @ApiProperty({ 
    description: 'iLO password',
    writeOnly: true,
  })
  @IsString()
  @Transform(({ value }) => '[REDACTED]', { toPlainOnly: true })
  password: string;
}
