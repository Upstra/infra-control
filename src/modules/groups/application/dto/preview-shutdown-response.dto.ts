import { ApiProperty } from '@nestjs/swagger';
import { GroupType } from '../../domain/enums/group-type.enum';

export class ShutdownResourceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  priority: number;

  @ApiProperty()
  state: string;

  @ApiProperty()
  shutdownOrder: number;
}

export class PreviewShutdownResponseDto {
  @ApiProperty()
  groupId: string;

  @ApiProperty()
  groupName: string;

  @ApiProperty({ enum: GroupType })
  groupType: GroupType;

  @ApiProperty({ type: [ShutdownResourceDto] })
  resources: ShutdownResourceDto[];

  @ApiProperty()
  totalResources: number;

  @ApiProperty()
  estimatedDuration: number;
}
