import { PermissionDtoInterface } from '@/modules/permissions/application/interfaces/permission.dto.interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber } from 'class-validator';

export class PermissionServerDto implements PermissionDtoInterface {
  @ApiProperty()
  @IsBoolean()
  allowWrite?: boolean;

  @ApiProperty()
  @IsBoolean()
  allowRead?: boolean;

  @ApiProperty()
  @IsNumber()
  serverId?: number;
}
