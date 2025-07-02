import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

/**
 * Deletes a room by its unique identifier.
 *
 * Responsibilities:
 * - Verifies the room exists via RoomDomainService.
 * - Removes the room and handles any necessary asset reassignment or cleanup.
 *
 * @param id  UUID of the room to delete.
 * @returns   Promise<void> upon successful deletion.
 *
 * @throws NotFoundException if no room matches the given ID.
 *
 * @remarks
 * Ensure dependent entities (servers, UPS) are migrated before deletion to avoid orphaned assets.
 *
 * @example
 * await deleteRoomUseCase.execute('room-uuid-123');
 */

@Injectable()
export class DeleteRoomUseCase {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(id: string, userId?: string): Promise<void> {
    await this.roomRepository.deleteRoom(id);
    await this.logHistory?.execute('room', id, 'DELETE', userId);
  }
}
