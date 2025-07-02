import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { RoomResponseDto, RoomCreationDto } from '../dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

/**
 * Creates a new room entity with the specified attributes.
 *
 * Responsibilities:
 * - Validates CreateRoomDto fields (name, location, capacity).
 * - Delegates to RoomDomainService to persist the entity.
 * - Returns the created RoomDto including generated ID.
 *
 * @param dto  CreateRoomDto containing room details.
 * @returns    Promise<RoomDto> the newly created room DTO.
 *
 * @throws ValidationException if DTO fields are invalid.
 *
 * @example
 * const newRoom = await createRoomUseCase.execute({ name: 'Lab A', location: '1st Floor', capacity: 10 });
 */

@Injectable()
export class CreateRoomUseCase {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    dto: RoomCreationDto,
    userId?: string,
  ): Promise<RoomResponseDto> {
    const room = await this.roomRepository.createRoom(dto.name);
    await this.logHistory?.execute('room', room.id, 'CREATE', userId);
    return RoomResponseDto.from(room);
  }
}
