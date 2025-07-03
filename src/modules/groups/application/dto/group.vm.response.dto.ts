import { ApiProperty } from '@nestjs/swagger';
import { GroupVm } from '../../domain/entities/group.vm.entity';

export class GroupVmResponseDto {
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

  @ApiProperty()
  serverGroupId: string;

  @ApiProperty({ type: [String] })
  vmIds: string[];

  constructor(entity: GroupVm) {
    this.id = entity.id;
    this.name = entity.name;
    this.priority = entity.priority;
    this.description = entity.description;
    this.cascade = entity.cascade;
    this.roomId = entity.roomId;
    this.serverGroupId = entity.serverGroupId;
    this.vmIds = entity.vms?.map((v) => v.id) ?? [];
  }
}
