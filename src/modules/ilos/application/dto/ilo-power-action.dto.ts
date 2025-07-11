import { IsEnum, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum IloPowerAction {
  START = 'start',
  STOP = 'stop',
}

export class IloCredentialsDto {
  @ApiProperty({ description: 'iLO username' })
  @IsString()
  user: string;

  @ApiProperty({ description: 'iLO password' })
  @IsString()
  password: string;
}

export class IloPowerActionDto {
  @ApiProperty({ enum: IloPowerAction, description: 'Power action to perform' })
  @IsEnum(IloPowerAction)
  action: IloPowerAction;

  @ApiProperty({ type: IloCredentialsDto, description: 'iLO credentials' })
  @ValidateNested()
  @Type(() => IloCredentialsDto)
  credentials: IloCredentialsDto;
}
