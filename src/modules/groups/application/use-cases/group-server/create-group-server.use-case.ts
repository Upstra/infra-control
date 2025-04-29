import { Injectable, Inject } from '@nestjs/common';
import { GroupRepositoryInterface } from '../../../domain/interfaces/group.repository.interface';
import { GroupServerDto } from '../../dto/group.server.dto';

@Injectable()
export class CreateGroupServerUseCase {
  constructor(
    @Inject('GroupRepositoryInterface')
    private readonly groupRepository: GroupRepositoryInterface,
  ) {}

  async execute(groupDto: GroupServerDto): Promise<GroupServerDto> {
    throw new Error(`Method not implemented: ${groupDto}`);
  }
}
