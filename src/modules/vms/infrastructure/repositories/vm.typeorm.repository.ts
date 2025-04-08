import { Injectable } from '@nestjs/common';
import { Vm } from '../../domain/entities/vm.entity';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { DataSource, Repository } from 'typeorm';
import { VmNotFoundException } from '@/modules/vms/domain/exceptions/vm.exception';

@Injectable()
export class VmTypeormRepository
  extends Repository<Vm>
  implements VmRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(Vm, dataSource.createEntityManager());
  }

  async findAll(): Promise<Vm[]> {
    return await this.find({
      relations: ['permissions'],
    });
  }

  async findVmById(id: string): Promise<Vm> {
    const vm = await this.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!vm) {
      throw new VmNotFoundException(id);
    }
    return vm;
  }

  async createVm(
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
  ): Promise<Vm> {
    const vm = this.create({
      name,
      state,
      grace_period_on,
      grace_period_off,
      os,
      adminUrl,
      ip,
      login,
      password,
      priority,
      serverId,
      groupId,
    });
    return await this.save(vm);
  }

  async updateVm(
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
  ): Promise<Vm> {
    const vm = await this.findVmById(id);
    vm.name = name ? name : vm.name;
    vm.state = state ? state : vm.state;
    vm.grace_period_on = grace_period_on ? grace_period_on : vm.grace_period_on;
    vm.grace_period_off = grace_period_off
      ? grace_period_off
      : vm.grace_period_off;
    vm.os = os ? os : vm.os;
    vm.adminUrl = adminUrl ? adminUrl : vm.adminUrl;
    vm.ip = ip ? ip : vm.ip;
    vm.login = login ? login : vm.login;
    vm.password = password ? password : vm.password;
    vm.priority = priority ? priority : vm.priority;
    vm.serverId = serverId ? serverId : vm.serverId;
    vm.groupId = groupId ? groupId : vm.groupId;
    await this.save(vm);
    return vm;
  }

  async deleteVm(id: string): Promise<void> {
    await this.findVmById(id);
    await this.delete(id);
  }
}
