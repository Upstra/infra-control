import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VmMigrateDto {
  @ApiProperty({ description: 'Managed Object ID of the destination ESXi host' })
  @IsString()
  destinationMoid: string;
}