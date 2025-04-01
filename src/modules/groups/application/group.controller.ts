import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupDto } from './dto/group.dto';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  async getAllGroups(): Promise<GroupDto[]> {
    return this.groupService.getAllGroups();
  }

  @Get(':id')
  async getGroupById(@Param('id') id: string): Promise<GroupDto> {
    return this.groupService.getGroupById(id);
  }

  @Post()
  async createGroup(@Body() groupDto: GroupDto): Promise<GroupDto> {
    return this.groupService.createGroup(groupDto);
  }

  @Patch(':id')
  async updateGroup(
    @Param('id') id: string,
    @Body() groupDto: GroupDto,
  ): Promise<GroupDto> {
    return this.groupService.updateGroup(id, groupDto);
  }

  @Delete(':id')
  async deleteGroup(@Param('id') id: string): Promise<void> {
    return this.groupService.deleteGroup(id);
  }
}
