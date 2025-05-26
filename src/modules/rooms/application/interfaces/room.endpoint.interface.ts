import { RoomResponseDto, RoomCreationDto } from '../dto';

export interface RoomEndpointInterface {
  getAllRooms(): Promise<RoomResponseDto[]>;
  getRoomById(id: string): Promise<RoomResponseDto>;
  createRoom(roomDto: RoomCreationDto): Promise<RoomResponseDto>;
  updateRoom(id: string, roomDto: RoomCreationDto): Promise<RoomResponseDto>;
  deleteRoom(id: string): Promise<void>;
}
