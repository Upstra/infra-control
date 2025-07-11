import { IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VmwareConnectionDto } from './vmware-connection.dto';

export enum VmPowerAction {
  ON = 'on',
  OFF = 'off',
}

export class VmPowerActionDto {
  @ApiProperty({ enum: VmPowerAction, description: 'Power action to perform' })
  @IsEnum(VmPowerAction)
  action: VmPowerAction;

  @ApiProperty({ type: VmwareConnectionDto, description: 'VMware connection details' })
  @ValidateNested()
  @Type(() => VmwareConnectionDto)
  connection: VmwareConnectionDto;
}