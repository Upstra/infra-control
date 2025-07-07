import { ApiProperty } from '@nestjs/swagger';

export class PermissionCheckResponseDto {
  @ApiProperty({
    description: 'Whether the user has the requested permission',
    example: true,
  })
  hasPermission: boolean;

  @ApiProperty({
    description: 'UUID of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'UUID of the resource',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  resourceId: string;

  @ApiProperty({
    description: 'Type of the resource',
    example: 'vm',
  })
  resourceType: 'server' | 'vm';

  @ApiProperty({
    description: 'Permission that was checked',
    example: 1,
  })
  permission: number;
}
