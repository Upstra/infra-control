import { Injectable, Inject } from '@nestjs/common';
import { GroupRepositoryInterface } from '../../../domain/interfaces/group.repository.interface';
import { GroupVmDto } from '../../dto/group.vm.dto';

@Injectable()
export class UpdateGroupVmUseCase {
  constructor(
    @Inject('GroupRepositoryInterface')
    private readonly groupRepository: GroupRepositoryInterface,
  ) {}

  async execute(id: string, groupDto: GroupVmDto): Promise<GroupVmDto> {
    throw new Error('Method not implemented.');
  }
}
