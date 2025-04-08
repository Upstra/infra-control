import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ServerService } from '../services/server.service';
import { ServerResponseDto } from '../dto/server.response.dto';
import { ServerCreationDto } from '../dto/server.creation.dto';
import { ServerEndpointInterface } from '@/modules/servers/application/interfaces/server.endpoint.interface';
import { ServerUpdateDto } from '@/modules/servers/application/dto/server.update.dto';

@Controller('server')
export class ServerController implements ServerEndpointInterface {
  constructor(private readonly serverService: ServerService) {}

  @Get()
  async getAllServers(): Promise<ServerResponseDto[]> {
    return this.serverService.getAllServers();
  }

  @Get(':id')
  async getServerById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServerResponseDto> {
    return this.serverService.getServerById(id);
  }

  @Post()
  async createServer(
    @Body() serverDto: ServerCreationDto,
  ): Promise<ServerResponseDto> {
    return this.serverService.createServer(serverDto);
  }

  @Patch(':id')
  async updateServer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() serverDto: ServerUpdateDto,
  ): Promise<ServerResponseDto> {
    return this.serverService.updateServer(id, serverDto);
  }

  @Delete(':id')
  async deleteServer(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.serverService.deleteServer(id);
  }
}
