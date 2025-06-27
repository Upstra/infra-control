import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

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
