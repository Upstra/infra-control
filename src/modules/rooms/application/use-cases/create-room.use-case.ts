import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { RoomResponseDto, RoomCreationDto } from '../dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

/**
 * Creates a new room entity with the specified name and logs the action.
 *
 * Responsibilities:
 * - Creates a new room using the repository createRoom method with the provided name.
 * - Logs the creation action to the history system if userId is provided.
 * - Returns the created room as RoomResponseDto.
 *
 * @param dto     RoomCreationDto - DTO containing the room name to create.
 * @param userId  string - Optional. UUID of the user performing the creation for audit logging.
 * @returns       Promise<RoomResponseDto> the newly created room response DTO.
 *
 * @example
 * const newRoom = await createRoomUseCase.execute({ name: 'Lab A' });
 * const newRoomWithLog = await createRoomUseCase.execute({ name: 'Lab B' }, 'user-uuid');
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
