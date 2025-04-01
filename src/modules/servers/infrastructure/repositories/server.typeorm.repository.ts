import { Injectable } from '@nestjs/common';
import { Server } from '../../domain/entities/server.entity';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class ServerTypeormRepository
  extends Repository<Server>
  implements ServerRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(Server, dataSource.createEntityManager());
  }

  async findAll(): Promise<Server[]> {
    return await this.find({
      relations: ['vms'],
    });
  }

  async findServerById(id: number): Promise<Server> {
    return await this.findOne({
      where: { id },
      relations: ['vms'],
    });
  }

  async createServer(
    name: string,
    state: string,
    grace_period_on: number,
    grace_period_off: number,
    ip: string,
    login: string,
    password: string,
    type: string,
    priority: number,
    groupId: number,
    roomId: number,
    upsId: number,
  ): Promise<Server> {
    const server: Server = this.create({
      name,
      state,
      grace_period_on,
      grace_period_off,
      ip,
      login,
      password,
      type,
      priority,
      groupId,
      roomId,
      upsId,
      vms: [],
    });
    return await this.save(server);
  }

  async updateServer(
    id: number,
    name: string,
    state: string,
    grace_period_on: number,
    grace_period_off: number,
    ip: string,
    login: string,
    password: string,
    type: string,
    priority: number,
    groupId: number,
    roomId: number,
    upsId: number,
  ): Promise<Server> {
    const server = await this.findServerById(id);
    if (!server) {
      throw new Error('Server not found');
    }
    server.name = name;
    server.state = state;
    server.grace_period_on = grace_period_on;
    server.grace_period_off = grace_period_off;
    server.ip = ip;
    server.login = login;
    server.password = password;
    server.type = type;
    server.priority = priority;
    server.groupId = groupId;
    server.roomId = roomId;
    server.upsId = upsId;
    return await this.save(server);
  }

  async deleteServer(id: number): Promise<void> {
    const server = await this.findServerById(id);
    if (!server) {
      throw new Error('Server not found');
    }
    await this.delete(id);
  }
}
