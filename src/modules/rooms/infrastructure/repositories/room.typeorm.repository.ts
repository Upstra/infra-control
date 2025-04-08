import { Injectable } from '@nestjs/common';
import { Room } from '../../domain/entities/room.entity';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { DataSource, Repository } from 'typeorm';
import { RoomNotFoundException } from '@/modules/rooms/domain/exceptions/room.exception';

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

  async findRoomById(id: string): Promise<Room> {
    const room = await this.findOne({
      where: { id },
      relations: ['servers'],
    });
    if (!room) {
      throw new RoomNotFoundException(id);
    }
    return room;
  }

  async createRoom(name: string): Promise<Room> {
    const room = this.create({
      name,
      servers: [],
      ups: [],
    });
    return await this.save(room);
  }

  async updateRoom(id: string, name: string): Promise<Room> {
    const room = await this.findRoomById(id);
    room.name = name;
    return await this.save(room);
  }

  async deleteRoom(id: string): Promise<void> {
    await this.findRoomById(id);
    await this.delete(id);
  }
}
