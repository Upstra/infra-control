import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupServer } from '../../domain/entities/group.server.entity';
import { GroupVm } from '../../domain/entities/group.vm.entity';
import { GroupServerResponseDto } from '../dto/group.server.response.dto';
import { GroupVmResponseDto } from '../dto/group.vm.response.dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

@Injectable()
export class ToggleCascadeUseCase {
  constructor(
    @InjectRepository(GroupServer)
    private readonly groupServerRepository: Repository<GroupServer>,
    @InjectRepository(GroupVm)
    private readonly groupVmRepository: Repository<GroupVm>,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    type: 'server' | 'vm',
    id: string,
    cascade: boolean,
    userId?: string,
  ): Promise<GroupServerResponseDto | GroupVmResponseDto> {
    if (type === 'server') {
      const group = await this.groupServerRepository.findOne({
        where: { id },
        relations: ['servers', 'vmGroups'],
      });

      if (!group) {
        throw new NotFoundException(`Server group ${id} not found`);
      }

      const oldValue = { cascade: group.cascade };
      group.cascade = cascade;
      await this.groupServerRepository.save(group);

      await this.logHistory?.executeStructured({
        entity: 'group_server',
        entityId: id,
        action: 'UPDATE',
        userId,
        oldValue,
        newValue: { cascade },
        metadata: { field: 'cascade' },
      });

      return new GroupServerResponseDto(group);
    } else {
      const group = await this.groupVmRepository.findOne({
        where: { id },
        relations: ['vms'],
      });

      if (!group) {
        throw new NotFoundException(`VM group ${id} not found`);
      }

      const oldValue = { cascade: group.cascade };
      group.cascade = cascade;
      await this.groupVmRepository.save(group);

      await this.logHistory?.executeStructured({
        entity: 'group_vm',
        entityId: id,
        action: 'UPDATE',
        userId,
        oldValue,
        newValue: { cascade },
        metadata: { field: 'cascade' },
      });

      return new GroupVmResponseDto(group);
    }
  }
}
