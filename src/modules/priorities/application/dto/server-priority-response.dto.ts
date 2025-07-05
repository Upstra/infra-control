import { ApiProperty } from '@nestjs/swagger';

export class ServerPriorityResponseDto {
  @ApiProperty({
    description: 'Server ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Server name',
    example: 'web-server-01',
  })
  name: string;

  @ApiProperty({
    description: 'Priority level (1-999)',
    minimum: 1,
    maximum: 999,
    example: 1,
  })
  priority: number;

  @ApiProperty({
    description: 'Server IP address',
    example: '192.168.1.100',
  })
  ipAddress: string;

  @ApiProperty({
    description: 'Server state',
    enum: ['active', 'inactive', 'maintenance'],
    example: 'active',
  })
  state: string;
}
