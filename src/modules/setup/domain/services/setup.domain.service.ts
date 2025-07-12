import { Injectable } from '@nestjs/common';
import { SetupPhase, SetupState } from '../../application/types';

/**
 * Domain Service handling business logic related to application setup.
 * Determines the current setup state and guides the necessary next steps
 * based on business rules and system conditions.
 */
@Injectable()
export class SetupDomainService {
  /**
   * Determines the current setup state based on existing system entities.
   *
   * @param userCount - Number of registered users
   * @param roomCount - Number of created rooms
   * @param upsCount - Number of configured UPS devices
   * @param serverCount - Number of servers registered in the system
   * @param hasSearchedForVms - Optional flag indicating if the user has searched for VMs
   *
   * @returns {SetupState} - Object describing:
   *   - current setup phase
   *   - whether an admin user exists
   *   - whether infrastructure (servers) exists
   *   - the next required setup step (if any)
   *
   * ## Business Rules:
   * - Setup is considered COMPLETED if at least one server exists.
   * - If there are 0 or 1 users and no server, the phase is NOT_STARTED or IN_PROGRESS.
   * - If multiple users but no server: phase is still IN_PROGRESS.
   * - The next required step is inferred based on missing entities in order:
   *   user → room → UPS → server.
   *
   * @throws {Error} - if provided parameters are invalid (e.g., negative values)
   */
  determineSetupState(
    userCount: number,
    roomCount: number,
    upsCount: number,
    serverCount: number,
    hasSearchedForVms: boolean = false,
  ): SetupState {
    const hasAdminUser = userCount > 0;
    const hasInfrastructure = serverCount > 0;

    if (hasInfrastructure && hasSearchedForVms) {
      return {
        phase: SetupPhase.COMPLETED,
        hasAdminUser: true,
        hasInfrastructure: true,
        nextRequiredStep: null,
      };
    }

    if (hasInfrastructure && !hasSearchedForVms) {
      return {
        phase: SetupPhase.IN_PROGRESS,
        hasAdminUser: true,
        hasInfrastructure: true,
        nextRequiredStep: 'relationships',
      };
    }

    if (userCount <= 1) {
      return {
        phase:
          userCount === 0 ? SetupPhase.NOT_STARTED : SetupPhase.IN_PROGRESS,
        hasAdminUser,
        hasInfrastructure: false,
        nextRequiredStep: this.determineNextStep(
          userCount,
          roomCount,
          upsCount,
          serverCount,
          hasSearchedForVms,
        ),
      };
    }

    return {
      phase: SetupPhase.IN_PROGRESS,
      hasAdminUser: true,
      hasInfrastructure: false,
      nextRequiredStep: this.determineNextStep(
        userCount,
        roomCount,
        upsCount,
        serverCount,
        hasSearchedForVms,
      ),
    };
  }

  /**
   * Determines the next required setup step based on missing entities.
   * Not exposed publicly, used internally by `determineSetupState`.
   *
   * @param userCount - Number of users
   * @param roomCount - Number of rooms
   * @param upsCount - Number of UPS
   * @param serverCount - Number of servers
   *
   * @returns {string | null} - Next required step: 'welcome', 'planning', 'rooms',
   *   'ups', 'servers', or 'relationships'. Returns `null` if setup is complete.
   */
  private determineNextStep(
    userCount: number,
    roomCount: number,
    upsCount: number,
    serverCount: number,
    hasSearchedForVms: boolean,
  ): string | null {
    if (userCount === 0) return 'welcome';
    // After welcome, always go to planning step
    if (roomCount === 0 && upsCount === 0 && serverCount === 0) return 'planning';
    if (roomCount === 0) return 'rooms';
    if (upsCount === 0) return 'ups';
    if (serverCount === 0) return 'servers';
    if (!hasSearchedForVms) return 'relationships';
    return null;
  }

  /**
   * Checks if a user has permission to perform setup operations.
   *
   * @param userCanCreateServer - Whether the user has privileges to create servers
   * @param setupPhase - The current setup phase
   *
   * @returns {boolean} - `true` if setup can be performed, `false` otherwise
   *
   * ## Business Rules:
   * - Only users with server creation permissions (typically admins) may initiate setup.
   * - Setup is blocked if already marked as COMPLETED.
   */
  canUserPerformSetup(
    userCanCreateServer: boolean,
    setupPhase: SetupPhase,
  ): boolean {
    // Seuls les admins peuvent faire le setup
    if (!userCanCreateServer) return false;

    // Le setup ne peut être fait que s'il n'est pas déjà complété
    return setupPhase !== SetupPhase.COMPLETED;
  }

  /**
   * Indicates whether the system is undergoing a first-time installation.
   *
   * @param userCount - Number of users in the system
   * @param serverCount - Number of servers configured
   *
   * @returns {boolean} - `true` if it's the first-time setup, otherwise `false`
   *
   * ## Conditions:
   * - Considered first-time setup if there are no servers and 0 or 1 users.
   */
  isFirstTimeSetup(userCount: number, serverCount: number): boolean {
    return userCount <= 1 && serverCount === 0;
  }
}
