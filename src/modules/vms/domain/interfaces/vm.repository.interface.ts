import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';
import { Vm } from '../entities/vm.entity';
import { FindOneOptions } from 'typeorm';

export interface VmRepositoryInterface extends GenericRepositoryInterface<Vm> {
  findVmById(id: string): Promise<Vm>;
  save(vm: Vm): Promise<Vm>;
  deleteVm(id: string): Promise<void>;
  findOne(options: FindOneOptions<Vm>): Promise<Vm | null>;

  /**
   * Retrieve VMs with pagination.
   *
   * @param page - page number starting at 1
   * @param limit - items per page
   * @param serverId - optional server ID to filter by
   */
  paginate(
    page: number,
    limit: number,
    serverId?: string,
  ): Promise<[Vm[], number]>;
  countByState(state: 'UP' | 'DOWN'): Promise<number>;
}
