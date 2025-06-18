import { Injectable, Inject } from '@nestjs/common';
import { RoomRepositoryInterface } from '@/modules/rooms/domain/interfaces/room.repository.interface';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { UpsRepositoryInterface } from '@/modules/ups/domain/interfaces/ups.repository.interface';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { SetupDomainService } from '../../domain/services/setup.domain.service';
import { SetupStatusMapper } from '../mappers/setup-status.mapper';
import { SetupStatusDto, SetupStep } from '../dto/setup-status.dto';
import { SetupProgressRepositoryInterface } from '../../domain/interfaces/setup.repository.interface';
import { SetupPhase } from '../types';

/**
 * Application Use Case responsible for retrieving the current setup status of the system.
 * This class orchestrates repository queries, domain logic, and DTO mapping
 * to provide a clear representation of the current setup phase and next steps.
 */
@Injectable()
export class GetSetupStatusUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepo: UserRepositoryInterface,
    @Inject('RoomRepositoryInterface')
    private readonly roomRepo: RoomRepositoryInterface,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepo: ServerRepositoryInterface,
    @Inject('UpsRepositoryInterface')
    private readonly upsRepo: UpsRepositoryInterface,
    @Inject('SetupProgressRepositoryInterface')
    private readonly setupProgressRepo: SetupProgressRepositoryInterface,
    private readonly setupDomainService: SetupDomainService,
    private readonly setupStatusMapper: SetupStatusMapper,
  ) {}

  /**
   * Executes the use case to retrieve the current setup status.
   *
   * @param userId - (Optional) ID of the currently authenticated user.
   *   Used to determine if the user has admin permissions (canCreateServer).
   *
   * @returns {Promise<SetupStatusDto>} - A DTO representing the system's current setup state,
   *   including setup phase, available infrastructure, and required next steps.
   *
   * ## Workflow:
   * 1. Counts the current entities in the system (users, rooms, UPS, servers)
   * 2. Uses domain service to evaluate the global setup state
   * 3. Optionally checks if the current user is an admin
   * 4. Returns a structured DTO via the mapper
   */
  async execute(userId?: string): Promise<SetupStatusDto> {
    const counts = await this.getEntityCounts();
    const hasSearchedForVms = await this.hasCompletedVmDiscovery();

    const setupState = this.setupDomainService.determineSetupState(
      counts.userCount,
      counts.roomCount,
      counts.upsCount,
      counts.serverCount,
      hasSearchedForVms,
    );

    let isCurrentUserAdmin: boolean | undefined;
    if (userId) {
      isCurrentUserAdmin = await this.checkUserAdminStatus(userId);
    }

    const hasPassedWelcomeStep = !!(await this.setupProgressRepo.findOneByField(
      {
        field: 'step',
        value: SetupStep.WELCOME,
        disableThrow: true,
      },
    ));

    if (!hasPassedWelcomeStep) {
      setupState.phase = SetupPhase.IN_PROGRESS;
      setupState.nextRequiredStep = SetupStep.WELCOME;
    }

    return this.setupStatusMapper.toDto(
      setupState,
      counts,
      isCurrentUserAdmin,
      hasSearchedForVms,
    );
  }

  /**
   * Retrieves the total count of system entities necessary to assess setup progress.
   *
   * @returns {Promise<{ userCount: number; roomCount: number; upsCount: number; serverCount: number }>}
   * - The aggregated count of users, rooms, UPS devices, and servers.
   */
  private async getEntityCounts() {
    const [userCount, roomCount, upsCount, serverCount] = await Promise.all([
      this.userRepo.count(),
      this.roomRepo.count(),
      this.upsRepo.count(),
      this.serverRepo.count(),
    ]);

    return { userCount, roomCount, upsCount, serverCount };
  }

  /**
   * Determines whether a specific user has administrative permissions.
   *
   * @param userId - ID of the user to check
   * @returns {Promise<boolean>} - True if the user can create servers, false otherwise.
   *
   * ## Note:
   * - This check is based on the user’s assigned role having `canCreateServer = true`.
   * - It is safe-failed (returns false) if the user or role cannot be resolved.
   */
  private async checkUserAdminStatus(userId: string): Promise<boolean> {
    try {
      const user = await this.userRepo.findOneByField({
        field: 'id',
        value: userId,
        disableThrow: true,
        relations: ['role'],
      });
      return user.role?.canCreateServer ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Check if the VM discovery step has already been completed.
   *
   * @returns `true` when a progress entry exists for the VM discovery step,
   *   otherwise `false`.
   */
  private async hasCompletedVmDiscovery(): Promise<boolean> {
    const vmDiscoveryStep = await this.setupProgressRepo.findOneByField({
      field: 'step',
      value: SetupStep.VM_DISCOVERY,
      disableThrow: true,
    });

    return !!vmDiscoveryStep;
  }
}
