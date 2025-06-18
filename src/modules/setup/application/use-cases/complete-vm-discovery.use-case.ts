import { Injectable, Inject, BadRequestException } from '@nestjs/common';

import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { SetupStep } from '../dto/setup-status.dto';
import { SetupProgressRepositoryInterface } from '../../domain/interfaces/setup.repository.interface';
import { CompleteSetupStepUseCase } from './complete-setup-step.use-case';
import { VmDiscoveryResult } from '../types/vm-discovery-result.interface';

@Injectable()
export class CompleteVmDiscoveryUseCase {
  constructor(
    @Inject('SetupProgressRepositoryInterface')
    private readonly setupProgressRepo: SetupProgressRepositoryInterface,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepo: ServerRepositoryInterface,
    private readonly completeSetupStepUseCase: CompleteSetupStepUseCase,
  ) {}

  /**
   * Finalize the VM discovery phase of the setup workflow.
   *
   * Validates that the target server exists and that the server creation step
   * has already been completed before recording the discovery results.
   * If validation passes, the underlying `CompleteSetupStepUseCase` is invoked
   * to store the completion information.
   *
   * @param userId - ID of the user performing the discovery
   * @param discoveryResult - Details about the discovered VMs
   * @returns Resolves once the discovery results are saved
   */
  async execute(
    userId: string,
    discoveryResult: VmDiscoveryResult,
  ): Promise<void> {
    await this.serverRepo.findOneByField({
      field: 'id',
      value: discoveryResult.serverId,
    });

    const serverStepCompleted = await this.setupProgressRepo.hasCompletedStep(
      SetupStep.CREATE_SERVER,
    );

    if (!serverStepCompleted) {
      throw new BadRequestException(
        "L'étape de création de serveur doit être complétée avant la découverte des VMs",
      );
    }

    await this.completeSetupStepUseCase.execute(
      SetupStep.VM_DISCOVERY,
      userId,
      {
        serverId: discoveryResult.serverId,
        vmCount: discoveryResult.vmCount,
        vmIds: discoveryResult.vmIds || [],
        discoveredAt: new Date(),
      },
    );
  }
}
