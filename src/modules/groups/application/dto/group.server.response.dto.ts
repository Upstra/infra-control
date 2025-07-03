import { ApiProperty } from '@nestjs/swagger';
import { GroupServer } from '../../domain/entities/group.server.entity';

export class GroupServerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ minimum: 1, maximum: 4 })
  priority: number;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  cascade: boolean;

  @ApiProperty({ required: false })
  roomId?: string;

  @ApiProperty({ type: [String] })
  serverIds: string[];

  @ApiProperty({ type: [String] })
  vmGroupIds: string[];

  constructor(entity: GroupServer) {
    this.id = entity.id;
    this.name = entity.name;
    this.priority = entity.priority;
    this.description = entity.description;
    this.cascade = entity.cascade;
    this.roomId = entity.roomId;
    this.serverIds = entity.servers?.map((s) => s.id) ?? [];
    this.vmGroupIds = entity.vmGroups?.map((g) => g.id) ?? [];
  }
}
