import { Injectable } from '@nestjs/common';
import { Room } from '../../domain/entities/room.entity';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class RoomTypeormRepository
  extends Repository<Room>
  implements RoomRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(Room, dataSource.createEntityManager());
  }

  async findAll(): Promise<Room[]> {
    return await this.find({
      relations: ['servers'],
    });
  }

  async findRoomById(id: number): Promise<Room | null> {
    return await this.findOne({
      where: { id },
      relations: ['servers'],
    });
  }

  async createRoom(name: string): Promise<Room> {
    const room = this.create({
      name,
      servers: [],
      ups: [],
    });
    return await this.save(room);
  }

  async updateRoom(id: number, name: string): Promise<Room> {
    const room = await this.findRoomById(id);
    if (!room) {
      throw new Error('Room not found');
    }
    room.name = name;
    return await this.save(room);
  }

  async deleteRoom(id: number): Promise<void> {
    const room = await this.findRoomById(id);
    if (!room) {
      throw new Error('Room not found');
    }
    await this.delete(id);
  }
}
