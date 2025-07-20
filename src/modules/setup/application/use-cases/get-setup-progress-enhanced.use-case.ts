import { Injectable, Inject } from '@nestjs/common';
import { SetupProgressEnhancedDto, SetupStep } from '../dto';
import { RoomRepositoryInterface } from '../../../rooms/domain/interfaces/room.repository.interface';
import { UpsRepositoryInterface } from '../../../ups/domain/interfaces/ups.repository.interface';
import { ServerRepositoryInterface } from '../../../servers/domain/interfaces/server.repository.interface';
import { SetupProgressRepositoryInterface } from '../../domain/interfaces/setup.repository.interface';

@Injectable()
export class GetSetupProgressEnhancedUseCase {
  private readonly orderedSteps: SetupStep[] = [
    SetupStep.WELCOME,
    SetupStep.RESOURCE_PLANNING,
    SetupStep.ROOMS_CONFIG,
    SetupStep.UPS_CONFIG,
    SetupStep.SERVERS_CONFIG,
    SetupStep.RELATIONSHIPS,
    SetupStep.REVIEW,
    SetupStep.COMPLETE,
  ];

  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    @Inject('SetupProgressRepositoryInterface')
    private readonly setupProgressRepository: SetupProgressRepositoryInterface,
  ) {}

  async execute(): Promise<SetupProgressEnhancedDto> {
    const [roomCount, upsCount, serverCount] = await Promise.all([
      this.roomRepository.count(),
      this.upsRepository.count(),
      this.serverRepository.count(),
    ]);

    const resourceCounts = {
      rooms: roomCount,
      ups: upsCount,
      servers: serverCount,
    };

    const progressRecords = await this.setupProgressRepository.findAll();
    const completedSteps = progressRecords.map((record) => record.step);

    const currentStep = this.determineCurrentStep(
      completedSteps,
      resourceCounts,
    );

    const totalSteps = this.orderedSteps.length;
    const currentStepIndex = this.orderedSteps.indexOf(currentStep);
    const percentComplete = Math.round(
      (currentStepIndex / (totalSteps - 1)) * 100,
    );

    const canSkipToReview =
      resourceCounts.rooms > 0 &&
      resourceCounts.ups > 0 &&
      resourceCounts.servers > 0 &&
      !completedSteps.includes(SetupStep.REVIEW);

    const lastModified =
      progressRecords.length > 0
        ? new Date(
            Math.max(
              ...progressRecords.map((r) =>
                r.completedAt instanceof Date
                  ? r.completedAt.getTime()
                  : new Date(r.completedAt).getTime(),
              ),
            ),
          )
        : new Date();

    const isCompleted = completedSteps.includes(SetupStep.COMPLETE);

    return {
      currentStep,
      completedSteps,
      totalSteps,
      percentComplete,
      resourceCounts,
      lastModified,
      canSkipToReview,
      isCompleted,
    };
  }

  private determineCurrentStep(
    completedSteps: SetupStep[],
    resourceCounts: { rooms: number; ups: number; servers: number },
  ): SetupStep {
    // If setup is complete, return COMPLETE
    if (completedSteps.includes(SetupStep.COMPLETE)) {
      return SetupStep.COMPLETE;
    }

    // Find the first uncompleted step
    for (const step of this.orderedSteps) {
      if (!completedSteps.includes(step)) {
        // Special logic for resource-dependent steps
        switch (step) {
          case SetupStep.ROOMS_CONFIG:
            // Can skip if rooms already exist
            if (resourceCounts.rooms > 0 && !completedSteps.includes(step)) {
              continue;
            }
            break;
          case SetupStep.UPS_CONFIG:
            // Can skip if UPS already exist
            if (resourceCounts.ups > 0 && !completedSteps.includes(step)) {
              continue;
            }
            break;
          case SetupStep.SERVERS_CONFIG:
            // Can skip if servers already exist
            if (resourceCounts.servers > 0 && !completedSteps.includes(step)) {
              continue;
            }
            break;
        }
        return step;
      }
    }

    // If all steps are completed, return COMPLETE
    return SetupStep.COMPLETE;
  }
}
