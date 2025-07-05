import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class ShutdownRequestDto {
  @ApiProperty({
    type: [String],
    description: 'Array of group IDs (server or VM groups) to shutdown',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  groupIds: string[];
}
