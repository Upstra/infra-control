import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { RoomResponseDto, RoomCreationDto } from '../dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

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
