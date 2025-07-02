import { v4 as uuidv4 } from 'uuid';

export const mockRoomResponseDto = () => ({
  id: uuidv4().toString(),
  name: 'Room 69',
  servers: [],
  ups: [],
  serverCount: 0,
  upsCount: 0,
});
