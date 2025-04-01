import { Vm } from '../entities/vm.entity';

export interface VmRepositoryInterface {
  findAll(): Promise<Vm[]>;
  findVmById(id: number): Promise<Vm | null>;
  createVm(
    name: string,
    state: string,
    grace_period_on: number,
    grace_period_off: number,
    os: string,
    ip: string,
    login: string,
    password: string,
    priority: number,
    serverId: number,
    groupId: number,
  ): Promise<Vm>;
  updateVm(
    id: number,
    name: string,
    state: string,
    grace_period_on: number,
    grace_period_off: number,
    os: string,
    ip: string,
    login: string,
    password: string,
    priority: number,
    serverId: number,
    groupId: number,
  ): Promise<Vm>;
  deleteVm(id: number): Promise<void>;
}
