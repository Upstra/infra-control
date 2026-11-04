import { CollectIloHealthUseCase } from '../collect-ilo-health.use-case';
import { IloHealthEvents } from '../../../domain/events/ilo-health.events';
import { createIloHealth } from '../../../__mocks__/ilo-health.mock';

describe('CollectIloHealthUseCase', () => {
  const python = { executePython: jest.fn() };
  const cache = {
    set: jest.fn(),
    resetFailures: jest.fn(),
    recordFailure: jest.fn(),
  };
  const emitter = { emit: jest.fn() };
  const useCase = new CollectIloHealthUseCase(
    python as any,
    cache as any,
    emitter as any,
    { get: jest.fn() } as any,
  );
  const server = {
    id: 'srv-1',
    name: 'srv-b2-03',
    roomId: 'room-b',
    room: { inletWarnC: 28, inletCritC: 33 },
    ilo: { ip: 'mock-ilo-3', login: 'admin', password: 's3cret' },
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('caches the health for three intervals and emits ilo.health.checked', async () => {
    python.executePython.mockResolvedValue(createIloHealth());

    await useCase.execute(server);

    expect(python.executePython).toHaveBeenCalledWith(
      'ilo_health.sh',
      [
        '--ip',
        'mock-ilo-3',
        '--user',
        'admin',
        '--password',
        's3cret',
        '--timeout',
        '15',
      ],
      expect.anything(),
    );
    expect(cache.set).toHaveBeenCalledWith('srv-1', expect.anything(), 360);
    expect(emitter.emit).toHaveBeenCalledWith(
      IloHealthEvents.CHECKED,
      expect.objectContaining({
        serverId: 'srv-1',
        room: { inletWarnC: 28, inletCritC: 33 },
      }),
    );
  });

  it('emits ilo.health.unreachable on the third consecutive failure', async () => {
    python.executePython.mockRejectedValue(new Error('iLO answered HTTP 503'));
    cache.recordFailure.mockResolvedValueOnce(2).mockResolvedValueOnce(3);

    await expect(useCase.execute(server)).rejects.toThrow('503');
    expect(emitter.emit).not.toHaveBeenCalled();

    await expect(useCase.execute(server)).rejects.toThrow('503');
    expect(emitter.emit).toHaveBeenCalledWith(
      IloHealthEvents.UNREACHABLE,
      expect.objectContaining({ failures: 3, iloIp: 'mock-ilo-3' }),
    );
  });
});
