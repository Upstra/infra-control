import { GetServerPrioritiesUseCase } from '../get-server-priorities.use-case';
import { Server } from '../../../../servers/domain/entities/server.entity';

/**
 * The priority endpoints are admin-only (RequireRole isAdmin on the
 * controller), so the use case lists every server except vCenters, without a
 * per-user permission filter.
 */
describe('GetServerPrioritiesUseCase', () => {
  const servers = [
    { id: 'server-2', name: 'Server B', priority: 1, ip: '10.0.0.2', state: 'DOWN' },
    { id: 'server-1', name: 'Server A', priority: 2, ip: '10.0.0.1', state: 'UP' },
  ] as Server[];

  const build = (result: Server[]) => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(result),
    };
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(qb) };
    return {
      qb,
      repository,
      useCase: new GetServerPrioritiesUseCase(repository as any),
    };
  };

  it('excludes vCenters and orders by priority then name', async () => {
    const { useCase, qb, repository } = build(servers);

    await useCase.execute('admin-1');

    expect(repository.createQueryBuilder).toHaveBeenCalledWith('server');
    expect(qb.where).toHaveBeenCalledWith('server.type != :type', {
      type: 'vcenter',
    });
    expect(qb.orderBy).toHaveBeenCalledWith('server.priority', 'ASC');
    expect(qb.addOrderBy).toHaveBeenCalledWith('server.name', 'ASC');
  });

  it('maps servers to the priority response', async () => {
    const { useCase } = build(servers);

    await expect(useCase.execute('admin-1')).resolves.toEqual([
      { id: 'server-2', name: 'Server B', priority: 1, ipAddress: '10.0.0.2', state: 'DOWN' },
      { id: 'server-1', name: 'Server A', priority: 2, ipAddress: '10.0.0.1', state: 'UP' },
    ]);
  });

  it('returns an empty list when there is no server', async () => {
    const { useCase } = build([]);

    await expect(useCase.execute('admin-1')).resolves.toEqual([]);
  });
});
