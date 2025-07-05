import { ApiProperty } from '@nestjs/swagger';
import { GroupType } from '../../domain/enums/group-type.enum';

export class GroupResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ enum: GroupType })
  type: GroupType;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({
    description:
      'Number of servers in this group (only for SERVER type groups)',
  })
  serverCount?: number;

  @ApiProperty({
    description: 'Number of VMs in this group (only for VM type groups)',
  })
  vmCount?: number;
}
