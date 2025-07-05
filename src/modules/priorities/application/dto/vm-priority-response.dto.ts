import { ApiProperty } from '@nestjs/swagger';

export class VmPriorityResponseDto {
  @ApiProperty({
    description: 'VM ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'VM name',
    example: 'app-vm-01',
  })
  name: string;

  @ApiProperty({
    description: 'Server ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  serverId: string;

  @ApiProperty({
    description: 'Priority level (1-999)',
    minimum: 1,
    maximum: 999,
    example: 1,
  })
  priority: number;

  @ApiProperty({
    description: 'VM state',
    enum: ['running', 'stopped', 'paused'],
    example: 'running',
  })
  state: string;
}
