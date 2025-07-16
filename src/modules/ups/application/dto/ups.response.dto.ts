import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import { Ups } from '../../domain/entities/ups.entity';
import { ServerInUpsResponseDto } from './server-in-ups.response.dto';

export class UpsResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly ip: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly grace_period_on: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly grace_period_off: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly roomId: string;

  @ApiProperty({ description: 'Number of servers connected to this UPS' })
  @IsNumber()
  readonly serverCount: number;

  @ApiProperty({
    description: 'List of servers connected to this UPS',
    type: [ServerInUpsResponseDto],
  })
  readonly servers?: ServerInUpsResponseDto[];

  constructor(ups: Ups, serverCount = 0) {
    this.id = ups.id;
    this.name = ups.name;
    this.ip = ups.ip;
    this.grace_period_on = ups.grace_period_on;
    this.grace_period_off = ups.grace_period_off;
    this.roomId = ups.roomId;
    this.servers = ups.servers?.map(
      (server) => new ServerInUpsResponseDto(server),
    );
    this.serverCount = serverCount;
  }
}
