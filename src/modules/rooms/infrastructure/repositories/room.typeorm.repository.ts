import { Injectable } from '@nestjs/common';
import { Room } from '../../domain/entities/room.entity';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { Repository } from 'typeorm';
import { RoomNotFoundException } from '../../domain/exceptions/room.exception';
import { InjectRepository } from '@nestjs/typeorm';
import { InvalidQueryValueException } from '@/core/exceptions/repository.exception';

@Injectable()
export class RoomTypeormRepository implements RoomRepositoryInterface {
  constructor(
    @InjectRepository(Room)
    private readonly repo: Repository<Room>,
  ) {}

  save(entity: Room): Promise<Room> {
    return this.repo.save(entity);
  }

  count(): Promise<number> {
    return this.repo.count();
  }

  async findOneByField({
    field,
    value,
    disableThrow = false,
    relations = [],
  }): Promise<Room> {
    if (value === undefined || value === null) {
      throw new InvalidQueryValueException(String(field), value);
    }
    return this.repo
      .findOne({
        where: { [field]: value },
        relations,
      })
      .then((room) => {
        if (!room && !disableThrow) {
          throw new RoomNotFoundException(String(value));
        }
        return room;
      });
  }

  async findAll(): Promise<Room[]> {
    return await this.repo.find({
      relations: ['servers', 'servers.ilo', 'ups'],
    });
  }

  async paginate(page: number, limit: number): Promise<[Room[], number]> {
    return this.repo.findAndCount({
      relations: ['servers', 'servers.ilo', 'ups'],
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });
  }

  async findRoomById(id: string): Promise<Room> {
    const room = await this.repo.findOne({
      where: { id },
      relations: ['servers', 'servers.ilo', 'ups'],
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

  async paginateForTree(
    page: number,
    limit: number,
  ): Promise<[Room[], number]> {
    const queryBuilder = this.repo.createQueryBuilder('room');

    queryBuilder
      .leftJoinAndSelect('room.servers', 'server')
      .leftJoinAndSelect('server.vms', 'vm')
      .leftJoinAndSelect('room.ups', 'ups')
      .select([
        'room.id',
        'room.name',
        'server.id',
        'server.name',
        'vm.id',
        'vm.name',
        'ups.id',
        'ups.name',
      ])
      .orderBy('room.name', 'ASC')
      .addOrderBy('server.name', 'ASC')
      .addOrderBy('vm.name', 'ASC')
      .addOrderBy('ups.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    return queryBuilder.getManyAndCount();
  }
}
