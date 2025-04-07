import { Injectable } from '@nestjs/common';
import { Vm } from '../../domain/entities/vm.entity';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class VmTypeormRepository
  extends Repository<Vm>
  implements VmRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(Vm, dataSource.createEntityManager());
  }

  async findAll(): Promise<Vm[]> {
    return await this.find();
  }

  async findVmById(id: number): Promise<Vm> {
    return await this.findOne({ where: { id } });
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
    serverId: number,
    groupId: number,
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
    id: number,
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
    serverId: number,
    groupId: number,
  ): Promise<Vm> {
    const vm = await this.findVmById(id);
    if (!vm) {
      throw new Error('VM not found');
    }
    vm.name = name;
    vm.state = state;
    vm.grace_period_on = grace_period_on;
    vm.grace_period_off = grace_period_off;
    vm.os = os;
    vm.adminUrl = adminUrl;
    vm.ip = ip;
    vm.login = login;
    vm.password = password;
    vm.priority = priority;
    vm.serverId = serverId;
    vm.groupId = groupId;
    return await this.save(vm);
  }

  async deleteVm(id: number): Promise<void> {
    const vm = await this.findVmById(id);
    if (!vm) {
      throw new Error('VM not found');
    }
    await this.delete(id);
  }
}
