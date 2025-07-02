import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { RoomResponseDto } from '../dto';

/**
 * Retrieves a list of all rooms, including their metadata and associated assets.
 *
 * Responsibilities:
 * - Delegates to RoomDomainService to load all room entities.
 * - Maps each entity into RoomDto for client consumption.
 *
 * @returns Promise<RoomDto[]> an array of room DTOs.
 *
 * @remarks
 * Read-only; suitable for selection lists and overview screens.
 *
 * @example
 * const rooms = await getAllRoomsUseCase.execute();
 */

@Injectable()
export class GetAllRoomsUseCase {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
  ) {}

  async execute(): Promise<RoomResponseDto[]> {
    const rooms = await this.roomRepository.findAll();
    return rooms.map((room) => RoomResponseDto.from(room));
  }
}
