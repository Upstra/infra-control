import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { RoomResponseDto, RoomCreationDto } from '../dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

/**
 * Updates an existing room's name and logs the change to history.
 *
 * Responsibilities:
 * - Updates the room name using the repository updateRoom method.
 * - Logs the update action to the history system if userId is provided.
 * - Returns the updated room as RoomResponseDto.
 *
 * @param id      string - UUID of the room to update.
 * @param dto     RoomCreationDto - DTO containing the new name for the room.
 * @param userId  string - Optional. UUID of the user performing the update for audit logging.
 * @returns       Promise<RoomResponseDto> the updated room response DTO.
 *
 * @throws RoomNotFoundException if the room does not exist.
 *
 * @example
 * const updated = await updateRoomUseCase.execute('room-uuid-123', { name: 'New Room Name' });
 * const updatedWithLog = await updateRoomUseCase.execute('room-uuid-123', { name: 'New Name' }, 'user-uuid');
 */

@Injectable()
export class UpdateRoomUseCase {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    id: string,
    dto: RoomCreationDto,
    userId?: string,
  ): Promise<RoomResponseDto> {
    const room = await this.roomRepository.updateRoom(id, dto.name);
    await this.logHistory?.execute('room', room.id, 'UPDATE', userId);
    return RoomResponseDto.from(room);
  }
}
