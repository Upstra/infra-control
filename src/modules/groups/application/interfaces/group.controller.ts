import { Body, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { GroupDtoInterface } from './group.dto.interface';
import { GroupServiceInterface } from './group.service.interface';

export abstract class GroupController {
  protected constructor(
    protected readonly groupService: GroupServiceInterface,
  ) {}

  @Get()
  async getAllGroups(): Promise<GroupDtoInterface[]> {
    return this.groupService.getAllGroups();
  }

  @Get(':id')
  async getGroupById(@Param('id') id: string): Promise<GroupDtoInterface> {
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
    @Param('id') id: string,
    @Body() groupDto: GroupDtoInterface,
  ): Promise<GroupDtoInterface> {
    return this.groupService.updateGroup(id, groupDto);
  }

  @Delete(':id')
  async deleteGroup(@Param('id') id: string): Promise<void> {
    return this.groupService.deleteGroup(id);
  }
}
