import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { UpdateSystemSettingsDto } from './update-system-settings.dto';

export class ImportSettingsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  version: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  exportedAt: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateSystemSettingsDto)
  settings: UpdateSystemSettingsDto;
}
