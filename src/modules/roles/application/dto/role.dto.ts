import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class RoleDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsUUID()
  permissionServerId: string;

  @ApiProperty()
  @IsUUID()
  permissionVmId: string;
}
