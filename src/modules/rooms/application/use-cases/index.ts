import { CreateRoomUseCase } from './create-room.use-case';
import { DeleteRoomUseCase } from './delete-room.use-case';
import { GetAllRoomsUseCase } from './get-all-rooms.use-case';
import { GetRoomListUseCase } from './get-room-list.use-case';
import { GetRoomByIdUseCase } from './get-room-by-id.use-case';
import { UpdateRoomUseCase } from './update-room.use-case';

export const RoomUseCases = [
  GetRoomListUseCase,
  GetAllRoomsUseCase,
  GetRoomByIdUseCase,
  CreateRoomUseCase,
  UpdateRoomUseCase,
  DeleteRoomUseCase,
];

export {
  GetAllRoomsUseCase,
  GetRoomByIdUseCase,
  CreateRoomUseCase,
  UpdateRoomUseCase,
  DeleteRoomUseCase,
  GetRoomListUseCase,
};
