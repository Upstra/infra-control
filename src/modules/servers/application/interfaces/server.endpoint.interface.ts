import { ServerResponseDto } from '../dto/server.response.dto';
import { ServerCreationDto } from '../dto/server.creation.dto';
import { ServerUpdateDto } from '../dto/server.update.dto';

export interface ServerEndpointInterface {
  getAllServers(): Promise<ServerResponseDto[]>;
  getServerById(id: string): Promise<ServerResponseDto>;
  createServer(serverDto: ServerCreationDto): Promise<ServerResponseDto>;
  updateServer(
    id: string,
    serverDto: ServerUpdateDto,
  ): Promise<ServerResponseDto>;
  deleteServer(id: string): Promise<void>;
}
