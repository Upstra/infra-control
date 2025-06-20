import { Injectable, Inject, BadRequestException } from '@nestjs/common';

import { SetupStep } from '../dto/setup-status.dto';
import { SetupProgress } from '../../domain/entities/setup-progress.entity';
import { SetupProgressRepositoryInterface } from '../../domain/interfaces/setup.repository.interface';
import { SetupProgressMapper } from '../mappers/setup-progress.mapper';

@Injectable()
export class CompleteSetupStepUseCase {
  constructor(
    @Inject('SetupProgressRepositoryInterface')
    private readonly setupProgressRepo: SetupProgressRepositoryInterface,
  ) {}

  /**
   * Mark a specific setup step as completed for the given user.
   *
   * This method prevents duplicate completion of the same step by checking if
   * a progress entry already exists. It then records the completion time and
   * optional metadata associated with the step.
   *
   * @param step - The setup step to complete
   * @param userId - Identifier of the user completing the step
   * @param metadata - Additional information to store with the progress record
   * @returns The persisted {@link SetupProgress} entity
   */
  async execute(
    step: SetupStep,
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<SetupProgress> {
    const existingProgress = await this.setupProgressRepo.findByStep(step);

    if (existingProgress) {
      throw new BadRequestException(
        `L'étape ${step} a déjà été complétée le ${existingProgress.completedAt}`,
      );
    }

    let setupProgressEntity = SetupProgressMapper.fromDto({
      step,
      completedBy: userId,
      completedAt: new Date().toISOString(),
      metadata: metadata || {},
    });

    const progress = await this.setupProgressRepo.save(setupProgressEntity);

    return progress;
  }
}
