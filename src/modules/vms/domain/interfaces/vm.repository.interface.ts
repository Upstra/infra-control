import { Vm } from '../entities/vm.entity';

export interface VmRepositoryInterface {
  findAll(): Promise<Vm[]>;
  findVmById(id: string): Promise<Vm>;
  save(vm: Vm): Promise<Vm>;
  deleteVm(id: string): Promise<void>;
}
