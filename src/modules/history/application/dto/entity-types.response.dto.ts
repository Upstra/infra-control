import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayNotEmpty, IsNotEmpty } from 'class-validator';

export class EntityTypesResponseDto {
  @ApiProperty({
    description: 'List of distinct entity types found in history records',
    example: ['Server', 'VM', 'User', 'Group'],
    type: [String],
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  readonly entityTypes: string[];

  constructor(entityTypes: string[]) {
    this.entityTypes = Array.isArray(entityTypes)
      ? [...entityTypes]
      : [entityTypes].filter(Boolean);
  }
}
