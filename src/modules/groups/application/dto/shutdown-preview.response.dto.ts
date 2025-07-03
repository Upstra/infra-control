import { ApiProperty } from '@nestjs/swagger';

export class ShutdownStep {
  @ApiProperty()
  order: number;

  @ApiProperty({ enum: ['vm', 'server'] })
  type: 'vm' | 'server';

  @ApiProperty()
  entityId: string;

  @ApiProperty()
  entityName: string;

  @ApiProperty()
  groupId: string;

  @ApiProperty()
  groupName: string;

  @ApiProperty()
  priority: number;

  constructor(partial: Partial<ShutdownStep>) {
    Object.assign(this, partial);
  }
}

export class ShutdownPreviewResponseDto {
  @ApiProperty({ type: [ShutdownStep] })
  steps: ShutdownStep[];

  @ApiProperty()
  totalVms: number;

  @ApiProperty()
  totalServers: number;

  constructor(steps: ShutdownStep[]) {
    this.steps = steps;
    this.totalVms = steps.filter((s) => s.type === 'vm').length;
    this.totalServers = steps.filter((s) => s.type === 'server').length;
  }
}
