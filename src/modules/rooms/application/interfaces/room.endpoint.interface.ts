import { RoomDto } from '../dto/room.dto';

export interface RoomEndpointInterface {
  getAllRooms(): Promise<RoomDto[]>;
  getRoomById(id: string): Promise<RoomDto>;
  createRoom(roomDto: RoomDto): Promise<RoomDto>;
  updateRoom(id: string, roomDto: RoomDto): Promise<RoomDto>;
  deleteRoom(id: string): Promise<void>;
}
