import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { VmPriorityResponseDto } from '../dto/vm-priority-response.dto';
@Injectable()
export class GetVmPrioritiesUseCase {
  constructor(
    @InjectRepository(Vm)
    private readonly vmRepository: Repository<Vm>,
  ) {}

  async execute(_userId: string): Promise<VmPriorityResponseDto[]> {
    const vms = await this.vmRepository
      .createQueryBuilder('vm')
      .leftJoinAndSelect('vm.server', 'server')
      .where('server.type != :type', { type: 'vcenter' })
      .orderBy('vm.priority', 'ASC')
      .addOrderBy('vm.name', 'ASC')
      .getMany();

    return vms.map((vm) => ({
      id: vm.id,
      name: vm.name,
      serverId: vm.serverId,
      priority: vm.priority,
      state: vm.state,
    }));
  }
}
