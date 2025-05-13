import { Injectable } from '@nestjs/common';
import { Room } from '../../domain/entities/room.entity';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { Repository } from 'typeorm';
import { RoomNotFoundException } from '../../domain/exceptions/room.exception';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RoomTypeormRepository implements RoomRepositoryInterface {
  constructor(
    @InjectRepository(Room)
    private readonly repo: Repository<Room>,
  ) {}

  async findAll(): Promise<Room[]> {
    return await this.repo.find({
      relations: ['servers'],
    });
  }

  async findRoomById(id: string): Promise<Room> {
    const room = await this.repo.findOne({
      where: { id },
      relations: ['servers'],
    });
    if (!room) {
      throw new RoomNotFoundException(id);
    }
    return room;
  }

  async createRoom(name: string): Promise<Room> {
    const room = this.repo.create({
      name,
      servers: [],
      ups: [],
    });
    return await this.repo.save(room);
  }

  async updateRoom(id: string, name: string): Promise<Room> {
    const room = await this.findRoomById(id);
    room.name = name;
    return await this.repo.save(room);
  }

  async deleteRoom(id: string): Promise<void> {
    await this.findRoomById(id);
    await this.repo.delete(id);
  }
}
