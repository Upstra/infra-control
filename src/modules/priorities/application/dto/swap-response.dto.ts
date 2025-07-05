import { ApiProperty } from '@nestjs/swagger';

class SwappedResourceDto {
  @ApiProperty({
    description: 'Resource ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'New priority after swap',
    minimum: 1,
    maximum: 4,
    example: 2,
  })
  priority: number;
}

export class SwapServerResponseDto {
  @ApiProperty({
    description: 'First server with updated priority',
  })
  server1: SwappedResourceDto;

  @ApiProperty({
    description: 'Second server with updated priority',
  })
  server2: SwappedResourceDto;
}

export class SwapVmResponseDto {
  @ApiProperty({
    description: 'First VM with updated priority',
  })
  vm1: SwappedResourceDto;

  @ApiProperty({
    description: 'Second VM with updated priority',
  })
  vm2: SwappedResourceDto;
}