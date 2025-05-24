import { Injectable, Inject } from '@nestjs/common';
import { GroupRepositoryInterface } from '../../../domain/interfaces/group-vm.repository.interface';
import { GroupVmDto } from '../../dto/group.vm.dto';

@Injectable()
export class GetGroupVmByIdUseCase {
  constructor(
    @Inject('GroupRepositoryInterface')
    private readonly groupRepository: GroupRepositoryInterface,
  ) {}

  async execute(id: string): Promise<GroupVmDto> {
    throw new Error(`Method not implemented: ${id}`);
  }
}
