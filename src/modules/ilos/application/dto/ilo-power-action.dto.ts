import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum IloPowerAction {
  START = 'start',
  STOP = 'stop',
}

export class IloPowerActionDto {
  @ApiProperty({ enum: IloPowerAction, description: 'Power action to perform' })
  @IsEnum(IloPowerAction)
  action: IloPowerAction;
}
