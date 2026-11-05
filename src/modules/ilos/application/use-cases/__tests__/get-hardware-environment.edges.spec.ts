import { GetHardwareEnvironmentUseCase } from '../get-hardware-environment.use-case';
import { createIloHealth } from '../../../__mocks__/ilo-health.mock';

describe('GetHardwareEnvironmentUseCase without readings', () => {
  const servers = { findAll: jest.fn() };
  const rooms = { findRoomById: jest.fn() };
  const cache = { getMany: jest.fn() };
  const useCase = new GetHardwareEnvironmentUseCase(
    servers as any,
    rooms as any,
    cache as any,
  );

  it('returns nulls when no server reports and propagates an unknown room', async () => {
    servers.findAll.mockResolvedValue([
      { id: 's1', roomId: 'r1', iloId: 'i1' },
    ]);
    cache.getMany.mockResolvedValue({});

    await expect(useCase.forRoom('r1')).resolves.toEqual({
      maxInletC: null,
      maxInletServerId: null,
      totalConsumedW: null,
      serversWithIlo: 1,
      serversReporting: 0,
    });
    rooms.findRoomById.mockRejectedValueOnce(new Error('Room not found'));
    await expect(useCase.forRoom('missing')).rejects.toThrow('Room not found');
  });

  it('ignores servers without inlet sensor or power reading', async () => {
    servers.findAll.mockResolvedValue([
      { id: 's1', roomId: 'r1', iloId: 'i1', name: 'ilo4' },
    ]);
    cache.getMany.mockResolvedValue({
      s1: createIloHealth({ inletC: null, consumedW: null }),
    });

    await expect(useCase.global()).resolves.toMatchObject({
      maxInletC: null,
      maxInletServerName: null,
      totalConsumedW: null,
    });
  });
});
