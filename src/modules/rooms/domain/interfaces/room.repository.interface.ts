import { Room } from '../entities/room.entity';

export interface RoomRepositoryInterface {
  findAll(): Promise<Room[]>;
  findRoomById(id: string): Promise<Room>;
  createRoom(name: string): Promise<Room>;
  updateRoom(id: string, name: string): Promise<Room>;
  deleteRoom(id: string): Promise<void>;
}
