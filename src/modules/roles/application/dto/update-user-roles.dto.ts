import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsArray, IsOptional, ValidateIf } from 'class-validator';

export class UpdateUserRolesDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Single role ID to assign (for backward compatibility)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.roleId !== null)
  @IsUUID()
  roleId?: string | null;

  @ApiProperty({
    type: [String],
    description: 'Array of role IDs to assign to the user',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  roleIds?: string[];
}