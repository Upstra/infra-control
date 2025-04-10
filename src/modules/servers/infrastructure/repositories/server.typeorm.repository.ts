import { Injectable } from '@nestjs/common';
import { Server } from '../../domain/entities/server.entity';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';
import { DataSource, Repository } from 'typeorm';
import { ServerNotFoundException } from '../../domain/exceptions/server.notfound.exception';

@Injectable()
export class ServerTypeormRepository
  extends Repository<Server>
  implements ServerRepositoryInterface {
  constructor(private readonly dataSource: DataSource) {
    super(Server, dataSource.createEntityManager());
  }

  async findAll(): Promise<Server[]> {
    return await this.find({
      relations: ['vms'],
    });
  }

  async findServerById(id: string): Promise<Server> {
    const server = await this.findOne({
      where: { id },
      relations: ['vms'],
    });
    if (!server) {
      throw new ServerNotFoundException(id);
    }
    return server;
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
    groupId: string,
    roomId: string,
    upsId: string,
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
    id: string,
    name: string,
    state: string,
    grace_period_on: number,
    grace_period_off: number,
    ip: string,
    login: string,
    password: string,
    type: string,
    priority: number,
    groupId: string,
    roomId: string,
    upsId: string,
  ): Promise<Server> {
    const server = await this.findServerById(id);

    server.name = name ?? server.name;
    server.state = state ?? server.state;
    server.grace_period_on = grace_period_on ?? server.grace_period_on;
    server.grace_period_off = grace_period_off ?? server.grace_period_off;
    server.ip = ip ?? server.ip;
    server.login = login ?? server.login;
    server.password = password ?? server.password;
    server.type = type ?? server.type;
    server.priority = priority ?? server.priority;
    server.groupId = groupId ?? server.groupId;
    server.roomId = roomId ?? server.roomId;
    server.upsId = upsId ?? server.upsId;

    return await this.save(server);
  }


  async deleteServer(id: string): Promise<void> {
    await this.findServerById(id);
    await this.delete(id);
  }
}
