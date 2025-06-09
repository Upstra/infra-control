import { Injectable, Inject } from '@nestjs/common';
import { RoomRepositoryInterface } from '@/modules/rooms/domain/interfaces/room.repository.interface';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { UpsRepositoryInterface } from '@/modules/ups/domain/interfaces/ups.repository.interface';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { SetupDomainService } from '../../domain/services/setup.domain.service';
import { SetupStatusMapper } from '../mappers/setup-status.mapper';
import { SetupStatusDto } from '../dto/setup-status.dto';

/**
 * Use Case responsable de récupérer le statut du setup.
 * Orchestre les appels aux repositories, au domain service et au mapper.
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
    private readonly setupDomainService: SetupDomainService,
    private readonly setupStatusMapper: SetupStatusMapper,
  ) {}

  /**
   * Execute le use case pour récupérer le statut du setup
   * @param userId - ID de l'utilisateur courant (optionnel)
   */
  async execute(userId?: string): Promise<SetupStatusDto> {
    const counts = await this.getEntityCounts();

    const setupState = this.setupDomainService.determineSetupState(
      counts.userCount,
      counts.roomCount,
      counts.upsCount,
      counts.serverCount,
    );

    let isCurrentUserAdmin: boolean | undefined;
    if (userId) {
      isCurrentUserAdmin = await this.checkUserAdminStatus(userId);
    }

    return this.setupStatusMapper.toDto(setupState, counts, isCurrentUserAdmin);
  }

  /**
   * Récupère le nombre d'entités de chaque type
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
   * Vérifie si un utilisateur a les droits admin
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
}
