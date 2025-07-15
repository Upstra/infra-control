import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Server } from '../../../servers/domain/entities/server.entity';
import { SwapServerResponseDto } from '../dto/swap-response.dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { GenerateMigrationPlanUseCase } from './generate-migration-plan.use-case';

@Injectable()
export class SwapServerPrioritiesUseCase {
  constructor(
    private readonly logHistory: LogHistoryUseCase,
    private readonly generateMigrationPlan: GenerateMigrationPlanUseCase,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    server1Id: string,
    server2Id: string,
    userId: string,
  ): Promise<SwapServerResponseDto> {
    return await this.dataSource.transaction(async (manager) => {
      const serverRepo = manager.getRepository(Server);

      const server1 = await serverRepo.findOne({
        where: { id: server1Id },
      });
      const server2 = await serverRepo.findOne({
        where: { id: server2Id },
      });

      if (!server1) {
        throw new NotFoundException(`Server with id ${server1Id} not found`);
      }
      if (!server2) {
        throw new NotFoundException(`Server with id ${server2Id} not found`);
      }

      if (server1.type === 'vcenter' || server2.type === 'vcenter') {
        throw new BadRequestException(
          'Cannot swap priorities for vCenter servers',
        );
      }

      const temp = server1.priority;
      server1.priority = server2.priority;
      server2.priority = temp;

      await serverRepo.save([server1, server2]);

      await this.logHistory.execute(
        'server',
        `${server1Id}-${server2Id}`,
        'SWAP_PRIORITY',
        userId,
      );

      await this.generateMigrationPlan.execute();

      return {
        server1: { id: server1.id, priority: server1.priority },
        server2: { id: server2.id, priority: server2.priority },
      };
    });
  }
}
