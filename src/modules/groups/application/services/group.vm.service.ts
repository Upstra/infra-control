import { Injectable, Inject } from '@nestjs/common';
import { GroupRepositoryInterface } from '../../domain/interfaces/group.repository.interface';
import { GroupVmDto } from '../dto/group.vm.dto';
import { GroupEndpointInterface } from '../interfaces/group.endpoint.Interface';

@Injectable()
export class GroupVmService implements GroupEndpointInterface<GroupVmDto> {
  constructor(
    @Inject('GroupRepositoryInterface')
    private readonly groupRepository: GroupRepositoryInterface,
  ) { }

  async getAllGroups(): Promise<GroupVmDto[]> {
    throw new Error('Method not implemented.');
  }

  async getGroupById(id: string): Promise<GroupVmDto> {
    throw new Error('Method not implemented.');
  }

  async createGroup(groupDto: GroupVmDto): Promise<GroupVmDto> {
    throw new Error('Method not implemented.');
  }

  async updateGroup(id: string, groupDto: GroupVmDto): Promise<GroupVmDto> {
    throw new Error('Method not implemented.');
  }

  async deleteGroup(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
