import {
  Body,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { GroupDtoInterface } from './group.dto.interface';
import { GroupEndpointInterface } from './group.endpoint.Interface';

export abstract class GroupController implements GroupEndpointInterface {
  protected constructor(
    protected readonly groupService: GroupEndpointInterface,
  ) { }

  @Get()
  async getAllGroups(): Promise<GroupDtoInterface[]> {
    return this.groupService.getAllGroups();
  }

  @Get(':id')
  async getGroupById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GroupDtoInterface> {
    return this.groupService.getGroupById(id);
  }

  @Post()
  async createGroup(
    @Body() groupDto: GroupDtoInterface,
  ): Promise<GroupDtoInterface> {
    return this.groupService.createGroup(groupDto);
  }

  @Patch(':id')
  async updateGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() groupDto: GroupDtoInterface,
  ): Promise<GroupDtoInterface> {
    return this.groupService.updateGroup(id, groupDto);
  }

  @Delete(':id')
  async deleteGroup(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.groupService.deleteGroup(id);
  }
}
