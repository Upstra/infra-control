import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class UpsUpdateDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly name?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly ip?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly grace_period_on?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly grace_period_off?: number;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  readonly roomId?: string;

  @ApiProperty({
    description:
      "Puissance nominale saisie (W), utilisée si l'onduleur ne la remonte pas",
    required: false,
    nullable: true,
    example: 3000,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000000)
  readonly nominalPowerW?: number | null;

  @ApiProperty({
    description:
      "Avec un roomId différent, déplace aussi tous les serveurs de l'onduleur dans la nouvelle salle",
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  readonly moveServers?: boolean;
}
