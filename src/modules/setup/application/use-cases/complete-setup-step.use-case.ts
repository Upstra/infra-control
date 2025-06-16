import { Injectable, Inject, BadRequestException } from '@nestjs/common';

import { SetupStep } from '../dto/setup-status.dto';
import { SetupProgress } from '../../domain/entities/setup-progress.entity';
import { SetupProgressRepositoryInterface } from '../../domain/interfaces/setup.repository.interface';
import { SetupStatusMapper } from '../mappers/setup-status.mapper';
import { SetupProgressMapper } from '../mappers/setup-progress.mapper';

@Injectable()
export class CompleteSetupStepUseCase {
  constructor(
    @Inject('SetupProgressRepositoryInterface')
    private readonly setupProgressRepo: SetupProgressRepositoryInterface,
  ) {}

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
