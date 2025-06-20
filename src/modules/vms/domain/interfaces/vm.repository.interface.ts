import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';
import { Vm } from '../entities/vm.entity';

export interface VmRepositoryInterface extends GenericRepositoryInterface<Vm> {
  findVmById(id: string): Promise<Vm>;
  save(vm: Vm): Promise<Vm>;
  deleteVm(id: string): Promise<void>;
}
