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
   * Completes the VM discovery step in the setup process.
   * This method checks if the server exists and if the server creation step has been completed.
   * If the server creation step is not completed, it throws a BadRequestException.
   * If the server exists and the step is completed, it calls the completeSetupStepUseCase to mark the VM discovery step as completed.
   *
   *
   * @param userId
   * @param discoveryResult
   *
   * @returns {Promise<void>} - A promise that resolves when the VM discovery step is successfully completed.
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
