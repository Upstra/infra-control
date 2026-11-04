import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class RoomCreationDto {
  @ApiProperty({
    description: 'Nom de la salle',
    example: 'My Room',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty({
    description: "Seuil d'alerte de température d'entrée d'air (°C)",
    example: 30,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(80)
  readonly inletWarnC?: number | null;

  @ApiProperty({
    description: "Seuil critique de température d'entrée d'air (°C)",
    example: 35,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(80)
  readonly inletCritC?: number | null;
}
