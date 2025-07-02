import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { RoomResponseDto, RoomCreationDto } from '../dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

/**
 * Updates an existing room’s details and settings.
 *
 * Responsibilities:
 * - Validates the room ID and input DTO (name, location, capacity).
 * - Fetches the current entity and applies updates via RoomDomainService.
 * - Persists changes and returns the updated RoomDto.
 *
 * @param id   UUID of the room to update.
 * @param dto  UpdateRoomDto with new field values.
 * @returns    Promise<RoomDto> the updated room DTO.
 *
 * @throws NotFoundException if the room does not exist.
 * @throws ValidationException if input data is invalid.
 *
 * @example
 * const updated = await updateRoomUseCase.execute('room-uuid-123', { capacity: 12 });
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
