import { CollectIloHealthUseCase } from '../collect-ilo-health.use-case';

describe('CollectIloHealthUseCase edge cases', () => {
  const python = { executePython: jest.fn() };
  const cache = {
    set: jest.fn(),
    resetFailures: jest.fn(),
    recordFailure: jest.fn().mockResolvedValue(1),
  };
  const emitter = { emit: jest.fn() };
  const useCase = new CollectIloHealthUseCase(
    python as any,
    cache as any,
    emitter as any,
    { get: () => '30' } as any,
  );

  it('skips servers without iLO', async () => {
    await expect(
      useCase.execute({ id: 's', name: 'n' } as any),
    ).resolves.toBeNull();
    expect(python.executePython).not.toHaveBeenCalled();
  });

  it('treats an unexpected script output as a failure without a room', async () => {
    python.executePython.mockResolvedValue('garbage');

    await expect(
      useCase.execute({
        id: 's',
        name: 'n',
        ilo: { ip: 'i', login: 'l', password: 'p' },
      } as any),
    ).rejects.toThrow('Invalid ilo_health output');
    expect(cache.recordFailure).toHaveBeenCalledWith('s');
    expect(useCase.intervalSeconds()).toBe(30);
  });
});
