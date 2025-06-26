import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
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

  constructor(
    id: string,
    name: string,
    servers: ServerResponseDto[] = [],
    ups: UpsResponseDto[] = [],
  ) {
    this.id = id;
    this.name = name;
    this.servers = servers;
    this.ups = ups;
  }

  static from(room: Room): RoomResponseDto {
    const servers =
      room.servers?.map((s) => ServerResponseDto.fromEntity(s)) ?? [];
    const ups = room.ups?.map((u) => new UpsResponseDto(u)) ?? [];
    return new RoomResponseDto(room.id, room.name, servers, ups);
  }
}
