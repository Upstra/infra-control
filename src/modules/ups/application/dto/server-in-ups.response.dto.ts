import { ApiProperty } from '@nestjs/swagger';
import { Server } from '../../../servers/domain/entities/server.entity';

export class ServerInUpsResponseDto {
  @ApiProperty()
  readonly id: string;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly ip: string;

  @ApiProperty({ enum: ['UP', 'DOWN', 'UNKNOWN'] })
  readonly state: string;

  @ApiProperty({ enum: ['vcenter', 'esxi'] })
  readonly type: string;

  constructor(server: Server) {
    this.id = server.id;
    this.name = server.name;
    this.ip = server.ip;
    this.state = server.state;
    this.type = server.type;
  }
}
