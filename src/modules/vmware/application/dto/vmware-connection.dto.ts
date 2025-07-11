import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VmwareConnectionDto {
  @ApiProperty({
    description: 'IP address or hostname of the vCenter/ESXi server',
  })
  @IsString()
  host: string;

  @ApiProperty({ description: 'Username for vCenter/ESXi authentication' })
  @IsString()
  user: string;

  @ApiProperty({ description: 'Password for vCenter/ESXi authentication' })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: 'Port for vCenter/ESXi connection',
    default: 443,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  port?: number = 443;
}
