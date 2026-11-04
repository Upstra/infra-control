import { ApiProperty } from '@nestjs/swagger';

export class RoomEnvironmentResponseDto {
  @ApiProperty({ type: Number, nullable: true, example: 31 })
  maxInletC: number | null;

  @ApiProperty({ type: String, nullable: true })
  maxInletServerId: string | null;

  @ApiProperty({ type: Number, nullable: true, example: 1240 })
  totalConsumedW: number | null;

  @ApiProperty({ example: 3 })
  serversWithIlo: number;

  @ApiProperty({ example: 3 })
  serversReporting: number;
}

export class GlobalEnvironmentDto {
  @ApiProperty({ type: Number, nullable: true })
  maxInletC: number | null;

  @ApiProperty({ type: String, nullable: true })
  maxInletRoomId: string | null;

  @ApiProperty({ type: String, nullable: true })
  maxInletServerId: string | null;

  @ApiProperty({ type: String, nullable: true })
  maxInletServerName: string | null;

  @ApiProperty({ type: Number, nullable: true })
  totalConsumedW: number | null;
}

export class ServerHardwareDto {
  @ApiProperty({ type: Number, nullable: true })
  inletC: number | null;

  @ApiProperty({ type: Number, nullable: true })
  consumedW: number | null;

  @ApiProperty({ example: { ok: 1, total: 2 } })
  psu: { ok: number; total: number };

  @ApiProperty({ type: String, nullable: true, example: 'Warning' })
  health: string | null;

  @ApiProperty()
  collectedAt: string;
}
