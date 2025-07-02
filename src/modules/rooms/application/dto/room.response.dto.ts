import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Room } from '../../domain/entities/room.entity';
import { ServerResponseDto } from '../../../servers/application/dto/server.response.dto';
import { UpsResponseDto } from '../../../ups/application/dto/ups.response.dto';

export class RoomResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty({
    type: () => ServerResponseDto,
    isArray: true,
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServerResponseDto)
  readonly servers?: ServerResponseDto[];

  @ApiProperty({ type: () => UpsResponseDto, isArray: true, required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsResponseDto)
  readonly ups?: UpsResponseDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  readonly serverCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  readonly upsCount?: number;

  constructor(
    id: string,
    name: string,
    servers: ServerResponseDto[] = [],
    ups: UpsResponseDto[] = [],
    serverCount?: number,
    upsCount?: number,
  ) {
    this.id = id;
    this.name = name;
    this.servers = servers;
    this.ups = ups;
    this.serverCount = serverCount;
    this.upsCount = upsCount;
  }

  static from(room: Room, includeCounts = false): RoomResponseDto {
    const servers =
      room.servers?.map((s) => ServerResponseDto.fromEntity(s)) ?? [];
    const ups = room.ups?.map((u) => new UpsResponseDto(u)) ?? [];
    const serverCount = includeCounts ? servers.length : undefined;
    const upsCount = includeCounts ? ups.length : undefined;
    return new RoomResponseDto(
      room.id,
      room.name,
      servers,
      ups,
      serverCount,
      upsCount,
    );
  }
}
