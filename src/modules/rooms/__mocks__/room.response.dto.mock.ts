import { v4 as uuidv4 } from 'uuid';

export const mockRoomResponseDto = () => ({
  id: uuidv4().toString(),
  name: 'Room 69',
});
