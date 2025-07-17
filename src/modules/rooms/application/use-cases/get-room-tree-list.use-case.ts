import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import {
  RoomTreeDto,
  RoomTreeListResponseDto,
  ServerTreeDto,
  UpsTreeDto,
  VmTreeDto,
} from '../dto/room-tree.dto';

@Injectable()
export class GetRoomTreeListUseCase {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly repo: RoomRepositoryInterface,
  ) {}

  async execute(page = 1, limit = 10): Promise<RoomTreeListResponseDto> {
    const [rooms, total] = await this.repo.paginateForTree(page, limit);
    
    const roomDtos = rooms.map((room) => {
      const servers = room.servers?.map((server) => {
        const vms = server.vms?.map((vm) => new VmTreeDto(vm.id, vm.name)) ?? [];
        return new ServerTreeDto(server.id, server.name, vms);
      }) ?? [];
      
      const ups = room.ups?.map((up) => new UpsTreeDto(up.id, up.name)) ?? [];
      
      return new RoomTreeDto(room.id, room.name, servers, ups);
    });
    
    return new RoomTreeListResponseDto(roomDtos, total, page, limit);
  }
}