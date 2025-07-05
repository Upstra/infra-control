import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SwapServerPriorityDto {
  @ApiProperty({
    description: 'ID of the first server',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  server1Id: string;

  @ApiProperty({
    description: 'ID of the second server',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  server2Id: string;
}

export class SwapVmPriorityDto {
  @ApiProperty({
    description: 'ID of the first VM',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  vm1Id: string;

  @ApiProperty({
    description: 'ID of the second VM',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  vm2Id: string;
}