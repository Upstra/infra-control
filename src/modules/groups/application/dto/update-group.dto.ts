import { PartialType, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateGroupDto } from './create-group.dto';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @ApiProperty({ description: 'Whether the group is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
