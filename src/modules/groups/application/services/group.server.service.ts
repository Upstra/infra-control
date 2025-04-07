import { Inject, Injectable } from '@nestjs/common';
import { GroupEndpointInterface } from '../interfaces/group.endpoint.Interface';
import { GroupRepositoryInterface } from '../../domain/interfaces/group.repository.interface';
import { GroupServerDto } from '../dto/group.server.dto';

@Injectable()
export class GroupServerService implements GroupEndpointInterface {
  constructor(
    @Inject('GroupRepositoryInterface')
    private readonly groupRepository: GroupRepositoryInterface,
  ) {}

  async getAllGroups(): Promise<GroupServerDto[]> {
    throw new Error('Method not implemented.');
  }

  async getGroupById(id: string): Promise<GroupServerDto> {
    throw new Error('Method not implemented.');
  }

  async createGroup(groupDto: GroupServerDto): Promise<GroupServerDto> {
    throw new Error('Method not implemented.');
  }

  async updateGroup(
    id: string,
    groupDto: GroupServerDto,
  ): Promise<GroupServerDto> {
    throw new Error('Method not implemented.');
  }

  async deleteGroup(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
