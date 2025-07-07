import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

export class CheckServerPermissionDto {
  @ApiProperty({
    description: 'UUID of the server to check permissions for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  serverId: string;

  @ApiProperty({
    description: 'Permission bit to check',
    enum: PermissionBit,
    example: PermissionBit.READ,
  })
  @IsEnum(PermissionBit)
  permission: PermissionBit;
}
