import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VmPowerAction {
  ON = 'on',
  OFF = 'off',
}

export class VmPowerActionDto {
  @ApiProperty({ enum: VmPowerAction, description: 'Power action to perform' })
  @IsEnum(VmPowerAction)
  action: VmPowerAction;
}