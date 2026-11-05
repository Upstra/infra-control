import { BadRequestException } from '@nestjs/common';
import { MigrationOrchestratorService } from '../migration-orchestrator.service';

describe('MigrationOrchestratorService plan lock', () => {
  const redis = {
    safeGet: jest.fn().mockResolvedValue('migrated'),
    safeSet: jest.fn(),
    safeDel: jest.fn(),
    safeLRange: jest.fn().mockResolvedValue([]),
    safeSetNxEx: jest.fn(),
    safeReleaseLock: jest.fn(),
  };
  const python = { executePython: jest.fn() };
  const emitter = { emit: jest.fn() };
  const service = new MigrationOrchestratorService(
    redis as any,
    python as any,
    emitter as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('refuses a second plan while the Redis lock is held', async () => {
    redis.safeSetNxEx.mockResolvedValue(false);

    await expect(service.executeRestartPlan()).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(python.executePython).not.toHaveBeenCalled();
    expect(redis.safeReleaseLock).not.toHaveBeenCalled();
  });

  it('runs the plan with a 30 minute timeout and releases the lock even when it fails', async () => {
    redis.safeSetNxEx.mockResolvedValue(true);
    python.executePython.mockRejectedValue(new Error('vCenter unreachable'));

    await expect(service.executeRestartPlan()).rejects.toThrow(
      'vCenter unreachable',
    );

    expect(redis.safeSetNxEx).toHaveBeenCalledWith(
      'migration:lock',
      1800 + 300,
      expect.any(String),
    );
    expect(python.executePython).toHaveBeenCalledWith('restart_plan.py', [], {
      timeout: 1_800_000,
    });
    expect(redis.safeReleaseLock).toHaveBeenCalledWith(
      'migration:lock',
      redis.safeSetNxEx.mock.calls[0][2],
    );
  });
});
