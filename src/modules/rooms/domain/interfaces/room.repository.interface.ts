import { Room } from '../entities/room.entity';

export interface RoomRepositoryInterface {
  findAll(): Promise<Room[]>;
  findRoomById(id: number): Promise<Room | null>;
  createRoom(name: string): Promise<Room>;
  updateRoom(id: number, name: string): Promise<Room>;
  deleteRoom(id: number): Promise<void>;
}
