import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VmPowerAction {
  POWER_ON = 'on',
  POWER_OFF = 'off',
  RESET = 'reset',
  SUSPEND = 'suspend',
}

export class VmPowerActionDto {
  @ApiProperty({ enum: VmPowerAction, description: 'Power action to perform' })
  @IsEnum(VmPowerAction)
  action: VmPowerAction;
}
