import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';
import { Room } from '../entities/room.entity';

export interface RoomRepositoryInterface
  extends GenericRepositoryInterface<Room> {
  findRoomById(id: string): Promise<Room>;
  createRoom(name: string): Promise<Room>;
  updateRoom(id: string, name: string): Promise<Room>;
  deleteRoom(id: string): Promise<void>;

  /**
   * Retrieve rooms with pagination.
   *
   * @param page - page number starting at 1
   * @param limit - items per page
   */
  paginate(page: number, limit: number): Promise<[Room[], number]>;

  /**
   * Retrieve rooms optimized for tree navigation with minimal fields.
   *
   * @param page - page number starting at 1
   * @param limit - items per page
   */
  paginateForTree(page: number, limit: number): Promise<[Room[], number]>;
}
