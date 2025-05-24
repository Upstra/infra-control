import { Injectable, Inject } from '@nestjs/common';
import { GroupRepositoryInterface } from '../../../domain/interfaces/group-vm.repository.interface';
import { GroupVmDto } from '../../dto/group.vm.dto';

@Injectable()
export class CreateGroupVmUseCase {
  constructor(
    @Inject('GroupRepositoryInterface')
    private readonly groupRepository: GroupRepositoryInterface,
  ) {}

  async execute(groupDto: GroupVmDto): Promise<GroupVmDto> {
    throw new Error(`Method not implemented : ${groupDto}`);
  }
}
