import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';
import { GroupVm } from '../entities/group.vm.entity';

export interface GroupVmRepositoryInterface
  extends GenericRepositoryInterface<GroupVm> {
  findGroupById(id: string): Promise<GroupVm | null>;
  createGroup(name: string, priority: number): Promise<GroupVm>;
  updateGroup(id: string, name: string, priority: number): Promise<GroupVm>;
  deleteGroup(id: string): Promise<void>;
}
