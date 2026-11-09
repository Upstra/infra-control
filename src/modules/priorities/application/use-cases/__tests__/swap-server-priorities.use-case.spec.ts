import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SwapServerPrioritiesUseCase } from '../swap-server-priorities.use-case';
import { Server } from '../../../../servers/domain/entities/server.entity';

/**
 * Admin-only endpoint: no per-user permission check. The swap runs in a
 * transaction, logs the action and regenerates the migration plan (shutdown
 * order follows the priorities).
 */
describe('SwapServerPrioritiesUseCase', () => {
  const server = (id: string, priority: number, type = 'esxi') =>
    ({ id, priority, type }) as Server;

  const build = (servers: Record<string, Server | null>) => {
    const repo = {
      findOne: jest.fn(async ({ where: { id } }) => servers[id] ?? null),
      save: jest.fn(async (list) => list),
    };
    const manager = { getRepository: jest.fn(() => repo) };
    const dataSource = {
      transaction: jest.fn(async (work) => work(manager)),
    };
    const logHistory = { execute: jest.fn() };
    const generateMigrationPlan = { execute: jest.fn() };
    const useCase = new SwapServerPrioritiesUseCase(
      logHistory as any,
      generateMigrationPlan as any,
      dataSource as any,
    );
    return { useCase, repo, logHistory, generateMigrationPlan, dataSource };
  };

  it('swaps the priorities, logs it and regenerates the migration plan', async () => {
    const s1 = server('s1', 1);
    const s2 = server('s2', 4);
    const { useCase, repo, logHistory, generateMigrationPlan, dataSource } =
      build({ s1, s2 });

    const result = await useCase.execute('s1', 's2', 'admin-1');

    expect(dataSource.transaction).toHaveBeenCalled();
    expect(result).toEqual({
      server1: { id: 's1', priority: 4 },
      server2: { id: 's2', priority: 1 },
    });
    expect(repo.save).toHaveBeenCalledWith([s1, s2]);
    expect(logHistory.execute).toHaveBeenCalledWith(
      'server',
      's1-s2',
      'SWAP_PRIORITY',
      'admin-1',
    );
    expect(generateMigrationPlan.execute).toHaveBeenCalled();
  });

  it.each([
    ['first', 'missing', 's2'],
    ['second', 's1', 'missing'],
  ])('throws NotFoundException when the %s server does not exist', async (_, a, b) => {
    const { useCase, repo } = build({ s1: server('s1', 1), s2: server('s2', 2) });

    await expect(useCase.execute(a, b, 'admin-1')).rejects.toThrow(
      new NotFoundException('Server with id missing not found'),
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('refuses to swap a vCenter', async () => {
    const { useCase, repo, generateMigrationPlan } = build({
      s1: server('s1', 1),
      vc: server('vc', 5, 'vcenter'),
    });

    await expect(useCase.execute('s1', 'vc', 'admin-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.save).not.toHaveBeenCalled();
    expect(generateMigrationPlan.execute).not.toHaveBeenCalled();
  });

  it('fails the swap (rolled back by the transaction) when the plan cannot be generated', async () => {
    const { useCase, generateMigrationPlan } = build({
      s1: server('s1', 1),
      s2: server('s2', 2),
    });
    generateMigrationPlan.execute.mockRejectedValue(new Error('No UPS found'));

    await expect(useCase.execute('s1', 's2', 'admin-1')).rejects.toThrow(
      'No UPS found',
    );
  });
});
