import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class SetupStatisticsDto {
  @ApiProperty({
    description: "Nombre total d'utilisateurs",
    example: 1,
  })
  @IsNumber()
  userCount: number;

  @ApiProperty({
    description: 'Nombre total de salles',
    example: 0,
  })
  @IsNumber()
  roomCount: number;

  @ApiProperty({
    description: "Nombre total d'onduleurs",
    example: 0,
  })
  @IsNumber()
  upsCount: number;

  @ApiProperty({
    description: 'Nombre total de serveurs',
    example: 0,
  })
  @IsNumber()
  serverCount: number;

  @ApiProperty({
    description: "Nombre d'utilisateurs avec le rôle admin",
    example: 1,
  })
  @IsNumber()
  adminCount: number;
}
