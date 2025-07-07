import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { PermissionServerDto } from './permission.server.dto';

export class BatchPermissionServerDto {
  @ApiProperty({
    description: 'Array of permissions to create',
    type: [PermissionServerDto],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PermissionServerDto)
  permissions: PermissionServerDto[];
}

export class BatchPermissionServerResponseDto {
  @ApiProperty({
    description: 'Successfully created permissions',
    type: [PermissionServerDto],
  })
  created: PermissionServerDto[];

  @ApiProperty({
    description: 'Failed permissions with error details',
    type: [Object],
  })
  failed: Array<{
    permission: PermissionServerDto;
    error: string;
  }>;

  @ApiProperty({
    description: 'Total number of permissions processed',
  })
  total: number;

  @ApiProperty({
    description: 'Number of successfully created permissions',
  })
  successCount: number;

  @ApiProperty({
    description: 'Number of failed permissions',
  })
  failureCount: number;
}