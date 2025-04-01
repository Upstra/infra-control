import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class RoleDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsBoolean()
  allowWriteServer: boolean;

  @ApiProperty()
  @IsBoolean()
  allowReadServer: boolean;

  @ApiProperty()
  @IsBoolean()
  allowWriteVM: boolean;

  @ApiProperty()
  @IsBoolean()
  allowReadVM: boolean;
}
