import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';
import { Vm } from '../entities/vm.entity';

export interface VmRepositoryInterface extends GenericRepositoryInterface<Vm> {
  findVmById(id: string): Promise<Vm>;
  save(vm: Vm): Promise<Vm>;
  deleteVm(id: string): Promise<void>;

  /**
   * Retrieve VMs with pagination.
   *
   * @param page - page number starting at 1
   * @param limit - items per page
   */
  paginate(page: number, limit: number): Promise<[Vm[], number]>;
}
