import { Injectable, Inject } from '@nestjs/common';
import { GroupRepositoryInterface } from '../../../domain/interfaces/group.repository.interface';
import { GroupServerDto } from '../../dto/group.server.dto';

@Injectable()
export class GetGroupServerByIdUseCase {
  constructor(
    @Inject('GroupRepositoryInterface')
    private readonly groupRepository: GroupRepositoryInterface,
  ) {}

  async execute(id: string): Promise<GroupServerDto> {
    throw new Error(`Method not implemented: ${id}`);
  }
}
