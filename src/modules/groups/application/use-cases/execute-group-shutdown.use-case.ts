import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupRepository } from '../../infrastructure/repositories/group.repository';
import { GroupShutdownDto } from '../dto/group-shutdown.dto';
import { GroupType } from '../../domain/enums/group-type.enum';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { Server } from '../../../servers/domain/entities/server.entity';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

@Injectable()
export class ExecuteGroupShutdownUseCase {
  constructor(
    private readonly groupRepository: GroupRepository,
    @InjectRepository(Vm)
    private readonly vmRepository: Repository<Vm>,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    private readonly logHistory: LogHistoryUseCase,
  ) {}

  async execute(
    groupId: string,
    dto: GroupShutdownDto,
    userId: string,
  ): Promise<void> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundException(`Group with id "${groupId}" not found`);
    }

    const gracePeriod = dto.gracePeriod ?? 300;
    const force = dto.force ?? false;

    await this.logHistory.execute('group', groupId, 'SHUTDOWN', userId);

    try {
      await this.groupRepository.executeInTransaction(async (manager) => {
        if (group.type === GroupType.VM) {
          await this.shutdownVmsTransactional(
            groupId,
            gracePeriod,
            force,
            manager,
          );
        } else {
          await this.shutdownServersTransactional(
            groupId,
            gracePeriod,
            force,
            manager,
          );
        }
      });
    } catch (error) {
      if (!force) {
        throw new BadRequestException(
          `Shutdown failed: ${error.message}. Use force=true to ignore errors.`,
        );
      }
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async shutdownVmsTransactional(
    groupId: string,
    gracePeriod: number,
    force: boolean,
    manager: any,
  ): Promise<void> {
    const vms = await manager.find(Vm, {
      where: { groupId },
      order: { priority: 'ASC' },
    });

    for (const vm of vms) {
      try {
        if (vm.state === 'running') {
          await this.wait(gracePeriod * 1000);
          vm.state = 'stopped';
          await manager.save(vm);
        }
      } catch (error) {
        if (!force) {
          throw error;
        }
      }
    }
  }

  private async shutdownServersTransactional(
    groupId: string,
    gracePeriod: number,
    force: boolean,
    manager: any,
  ): Promise<void> {
    const servers = await manager.find(Server, {
      where: { groupId },
      order: { priority: 'ASC' },
    });

    for (const server of servers) {
      try {
        const vms = await manager.find(Vm, {
          where: { serverId: server.id },
          order: { priority: 'ASC' },
        });

        for (const vm of vms) {
          if (vm.state === 'running') {
            await this.wait(vm.grace_period_off * 1000);
            vm.state = 'stopped';
            await manager.save(vm);
          }
        }

        if (server.state === 'running') {
          await this.wait(gracePeriod * 1000);
          server.state = 'stopped';
          await manager.save(server);
        }
      } catch (error) {
        if (!force) {
          throw error;
        }
      }
    }
  }
}
