import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { PermissionVmDto } from './permission.vm.dto';

export class BatchPermissionVmDto {
  @ApiProperty({
    description: 'Array of permissions to create',
    type: [PermissionVmDto],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PermissionVmDto)
  permissions: PermissionVmDto[];
}

export class BatchPermissionVmResponseDto {
  @ApiProperty({
    description: 'Successfully created permissions',
    type: [PermissionVmDto],
  })
  created: PermissionVmDto[];

  @ApiProperty({
    description: 'Failed permissions with error details',
    type: [Object],
  })
  failed: Array<{
    permission: PermissionVmDto;
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
