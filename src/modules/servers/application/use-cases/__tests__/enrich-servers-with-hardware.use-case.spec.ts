import { EnrichServersWithHardwareUseCase } from '../enrich-servers-with-hardware.use-case';
import { IloHealthDomainService } from '@/modules/ilos/domain/services/ilo-health.domain.service';
import { createIloHealth } from '@/modules/ilos/__mocks__/ilo-health.mock';

describe('EnrichServersWithHardwareUseCase', () => {
  const cache = { getMany: jest.fn() };
  const useCase = new EnrichServersWithHardwareUseCase(
    cache as any,
    new IloHealthDomainService(),
  );

  it('adds the hardware summary of servers that report through their iLO', async () => {
    cache.getMany.mockResolvedValue({ s1: createIloHealth({ inletC: 31 }) });

    const [server] = await useCase.execute([{ id: 's1', iloId: 'i1' } as any]);

    expect(cache.getMany).toHaveBeenCalledWith(['s1']);
    expect(server.hardware).toEqual({
      inletC: 31,
      consumedW: 412,
      psu: { ok: 2, total: 2 },
      health: 'OK',
      collectedAt: '2026-11-04T20:06:58.000Z',
    });
  });

  it('sets hardware to null without iLO or without data', async () => {
    cache.getMany.mockResolvedValue({});

    const servers = await useCase.execute([
      { id: 's2', iloId: null } as any,
      { id: 's3', iloId: 'i3' } as any,
    ]);

    expect(servers.map((server) => server.hardware)).toEqual([null, null]);
  });
});
