import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class VmTreeDto {
  @ApiProperty()
  @IsUUID()
  readonly id: string;

  @ApiProperty()
  @IsString()
  readonly name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

export class ServerTreeDto {
  @ApiProperty()
  @IsUUID()
  readonly id: string;

  @ApiProperty()
  @IsString()
  readonly name: string;

  @ApiProperty({ type: () => VmTreeDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VmTreeDto)
  readonly vms: VmTreeDto[];

  constructor(id: string, name: string, vms: VmTreeDto[] = []) {
    this.id = id;
    this.name = name;
    this.vms = vms;
  }
}

export class UpsTreeDto {
  @ApiProperty()
  @IsUUID()
  readonly id: string;

  @ApiProperty()
  @IsString()
  readonly name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

export class RoomTreeDto {
  @ApiProperty()
  @IsUUID()
  readonly id: string;

  @ApiProperty()
  @IsString()
  readonly name: string;

  @ApiProperty({ type: () => ServerTreeDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServerTreeDto)
  readonly servers: ServerTreeDto[];

  @ApiProperty({ type: () => UpsTreeDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsTreeDto)
  readonly ups: UpsTreeDto[];

  constructor(
    id: string,
    name: string,
    servers: ServerTreeDto[] = [],
    ups: UpsTreeDto[] = [],
  ) {
    this.id = id;
    this.name = name;
    this.servers = servers;
    this.ups = ups;
  }
}

export class RoomTreeListResponseDto {
  @ApiProperty({ type: () => RoomTreeDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomTreeDto)
  readonly rooms: RoomTreeDto[];

  @ApiProperty()
  readonly total: number;

  @ApiProperty()
  readonly page: number;

  @ApiProperty()
  readonly limit: number;

  constructor(
    rooms: RoomTreeDto[],
    total: number,
    page: number,
    limit: number,
  ) {
    this.rooms = rooms;
    this.total = total;
    this.page = page;
    this.limit = limit;
  }
}