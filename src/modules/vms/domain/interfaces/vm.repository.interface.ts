import { Vm } from '../entities/vm.entity';

export interface VmRepositoryInterface {
  findAll(): Promise<Vm[]>;
  findVmById(id: string): Promise<Vm | null>;
  createVm(
    name: string,
    state: string,
    grace_period_on: number,
    grace_period_off: number,
    os: string,
    adminUrl: string,
    ip: string,
    login: string,
    password: string,
    priority: number,
    serverId: string,
    groupId: string,
  ): Promise<Vm>;
  updateVm(
    id: string,
    name: string,
    state: string,
    grace_period_on: number,
    grace_period_off: number,
    os: string,
    adminUrl: string,
    ip: string,
    login: string,
    password: string,
    priority: number,
    serverId: string,
    groupId: string,
  ): Promise<Vm>;
  deleteVm(id: string): Promise<void>;
}
