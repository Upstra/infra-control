import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class RoleDto {
  @ApiProperty()
  @IsString()
  id: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  permissionServerId: number;

  @ApiProperty()
  @IsNumber()
  permissionVmId: number;
}
