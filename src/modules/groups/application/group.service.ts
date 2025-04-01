import { Injectable, Inject } from '@nestjs/common';
import { GroupRepositoryInterface } from '../domain/interfaces/group.repository.interface';
import { GroupDto } from './dto/group.dto';

@Injectable()
export class GroupService {
  constructor(
    @Inject('GroupRepositoryInterface')
    private readonly groupRepository: GroupRepositoryInterface,
  ) {}

  async getAllGroups(): Promise<GroupDto[]> {
    return null;
  }

  async getGroupById(id: string): Promise<GroupDto> {
    return null;
  }

  async createGroup(groupDto: GroupDto): Promise<GroupDto> {
    return null;
  }

  async updateGroup(id: string, groupDto: GroupDto): Promise<GroupDto> {
    return null;
  }

  async deleteGroup(id: string): Promise<void> {
    return null;
  }
}
