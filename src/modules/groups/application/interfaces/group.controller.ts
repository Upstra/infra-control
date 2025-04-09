import {
  Body,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { GroupEndpointInterface } from './group.endpoint.Interface';

export abstract class GroupController<T> implements GroupEndpointInterface<T> {
  protected constructor(
    protected readonly groupService: GroupEndpointInterface<T>,
  ) { }

  @Get()
  async getAllGroups(): Promise<T[]> {
    return this.groupService.getAllGroups();
  }

  @Get(':id')
  async getGroupById(@Param('id', ParseUUIDPipe) id: string): Promise<T> {
    return this.groupService.getGroupById(id);
  }

  @Post()
  async createGroup(@Body() groupDto: T): Promise<T> {
    return this.groupService.createGroup(groupDto);
  }

  @Patch(':id')
  async updateGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() groupDto: T,
  ): Promise<T> {
    return this.groupService.updateGroup(id, groupDto);
  }

  @Delete(':id')
  async deleteGroup(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.groupService.deleteGroup(id);
  }
}
