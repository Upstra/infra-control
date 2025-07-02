import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

/**
 * Deletes a room by its unique identifier and logs the action.
 *
 * Responsibilities:
 * - Deletes the room using the repository deleteRoom method.
 * - Logs the deletion action to the history system if userId is provided.
 *
 * @param id      string - UUID of the room to delete.
 * @param userId  string - Optional. UUID of the user performing the deletion for audit logging.
 * @returns       Promise<void> upon successful deletion.
 *
 * @throws RoomNotFoundException if no room matches the given ID.
 *
 * @remarks
 * This method performs a direct deletion without checking for dependent entities.
 * Ensure any necessary cleanup is handled at the repository level.
 *
 * @example
 * await deleteRoomUseCase.execute('room-uuid-123');
 * await deleteRoomUseCase.execute('room-uuid-123', 'user-uuid');
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
