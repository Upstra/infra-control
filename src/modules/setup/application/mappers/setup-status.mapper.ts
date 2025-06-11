import { Injectable } from '@nestjs/common';
import { SetupStatusDto, SetupStep } from '../dto/setup-status.dto';
import { SetupPhase, SetupState } from '../types';

/**
 * Mapper responsable de transformer l'état du domaine en DTO pour l'API
 */
@Injectable()
export class SetupStatusMapper {
  /**
   * Maps the setup state and system entity counts into a `SetupStatusDto`.
   *
   * @param setupState - Domain-level representation of the current setup state
   * @param counts - Aggregated counts of key system entities:
   *   - `userCount`: number of users in the system
   *   - `roomCount`: number of rooms created
   *   - `upsCount`: number of UPS devices configured
   *   - `serverCount`: number of servers registered
   * @param isCurrentUserAdmin - Optional boolean indicating whether
   *   the current user has administrative privileges
   *
   * @returns {SetupStatusDto} - A fully populated DTO representing:
   *   - current infrastructure readiness
   *   - setup progress and phase
   *   - the current step in the setup workflow
   *   - user context if provided
   *
   * ## Logic Summary:
   * - Maps boolean flags based on presence of each key entity
   * - Determines if the system is in its initial setup phase
   * - Converts internal step identifiers to API-exposed enum values
   * - Computes the total number of setup steps and the index of the current step
   */
  toDto(
    setupState: SetupState,
    counts: {
      userCount: number;
      roomCount: number;
      upsCount: number;
      serverCount: number;
    },
    isCurrentUserAdmin?: boolean,
  ): SetupStatusDto {
    const dto = new SetupStatusDto();

    dto.hasAdminUser = setupState.hasAdminUser;
    dto.hasRooms = counts.roomCount > 0;
    dto.hasUps = counts.upsCount > 0;
    dto.hasServers = counts.serverCount > 0;

    dto.isFirstSetup =
      setupState.phase === SetupPhase.NOT_STARTED || counts.userCount === 0;

    dto.currentStep = this.mapNextStepToSetupStep(setupState.nextRequiredStep);

    const steps = Object.values(SetupStep);
    dto.totalSteps = steps.length;
    dto.currentStepIndex = steps.indexOf(dto.currentStep);

    if (isCurrentUserAdmin !== undefined) {
      dto.isCurrentUserAdmin = isCurrentUserAdmin;
    }

    return dto;
  }

  /**
   * Maps a raw domain-level string representing the next setup step
   * to a corresponding `SetupStep` enum used by the API.
   *
   * @param nextStep - Domain identifier of the next setup step
   *
   * @returns {SetupStep} - The corresponding enum value, or `COMPLETE` if unrecognized
   *
   * ## Mappings:
   * - 'welcome'       → SetupStep.WELCOME
   * - 'create-room'   → SetupStep.CREATE_ROOM
   * - 'create-ups'    → SetupStep.CREATE_UPS
   * - 'create-server' → SetupStep.CREATE_SERVER
   * - 'vm-discovery'  → SetupStep.VM_DISCOVERY
   * - `null` or unknown → SetupStep.COMPLETE
   */
  private mapNextStepToSetupStep(nextStep: string | null): SetupStep {
    const stepMapping: Record<string, SetupStep> = {
      welcome: SetupStep.WELCOME,
      'create-room': SetupStep.CREATE_ROOM,
      'create-ups': SetupStep.CREATE_UPS,
      'create-server': SetupStep.CREATE_SERVER,
      'vm-discovery': SetupStep.VM_DISCOVERY,
    };

    return nextStep && stepMapping[nextStep]
      ? stepMapping[nextStep]
      : SetupStep.COMPLETE;
  }
}
