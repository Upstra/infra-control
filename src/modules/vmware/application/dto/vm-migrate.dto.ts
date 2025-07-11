import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VmwareConnectionDto } from './vmware-connection.dto';

export class VmMigrateDto {
  @ApiProperty({ description: 'Managed Object ID of the destination ESXi host' })
  @IsString()
  destinationMoid: string;

  @ApiProperty({ type: VmwareConnectionDto, description: 'VMware connection details' })
  @ValidateNested()
  @Type(() => VmwareConnectionDto)
  connection: VmwareConnectionDto;
}