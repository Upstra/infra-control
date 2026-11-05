import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class UpsCreationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly ip!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly grace_period_on!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly grace_period_off!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly roomId!: string;

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
}
