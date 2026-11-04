import { GetHardwareEnvironmentUseCase } from '../get-hardware-environment.use-case';
import { createIloHealth } from '../../../__mocks__/ilo-health.mock';

describe('GetHardwareEnvironmentUseCase', () => {
  const servers = { findAll: jest.fn() };
  const rooms = { findRoomById: jest.fn() };
  const cache = { getMany: jest.fn() };
  const useCase = new GetHardwareEnvironmentUseCase(
    servers as any,
    rooms as any,
    cache as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    servers.findAll.mockResolvedValue([
      { id: 's1', name: 'srv-b2-01', roomId: 'room-b', iloId: 'i1' },
      { id: 's3', name: 'srv-b2-03', roomId: 'room-b', iloId: 'i3' },
      { id: 's4', name: 'srv-b2-04', roomId: 'room-b', iloId: 'i4' },
      { id: 'a1', name: 'srv-a-01', roomId: 'room-a', iloId: 'i9' },
    ]);
    cache.getMany.mockImplementation(async (ids: string[]) => {
      const all = {
        s1: createIloHealth({ inletC: 27, consumedW: 400 }),
        s3: createIloHealth({ inletC: 31, consumedW: 412 }),
        a1: createIloHealth({ inletC: 35, consumedW: 300 }),
      };
      return Object.fromEntries(
        ids.filter((id) => all[id]).map((id) => [id, all[id]]),
      );
    });
  });

  it('returns the hottest inlet and total draw of a room', async () => {
    await expect(useCase.forRoom('room-b')).resolves.toEqual({
      maxInletC: 31,
      maxInletServerId: 's3',
      totalConsumedW: 812,
      serversWithIlo: 3,
      serversReporting: 2,
    });
    expect(rooms.findRoomById).toHaveBeenCalledWith('room-b');
  });

  it('returns the hottest inlet across rooms with its room and server', async () => {
    await expect(useCase.global()).resolves.toMatchObject({
      maxInletC: 35,
      maxInletRoomId: 'room-a',
      maxInletServerName: 'srv-a-01',
      totalConsumedW: 1112,
    });
  });
});
