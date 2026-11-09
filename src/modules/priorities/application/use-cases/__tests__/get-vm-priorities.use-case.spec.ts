import { GetVmPrioritiesUseCase } from '../get-vm-priorities.use-case';
import { Vm } from '../../../../vms/domain/entities/vm.entity';

/**
 * Admin-only endpoint (RequireRole isAdmin on the controller): every VM is
 * listed except those hosted on a vCenter entry, without per-user filtering.
 */
describe('GetVmPrioritiesUseCase', () => {
  const vms = [
    { id: 'vm-2', name: 'db', serverId: 'server-1', priority: 1, state: 'poweredOn' },
    { id: 'vm-1', name: 'web', serverId: 'server-2', priority: 1, state: null },
  ] as unknown as Vm[];

  const build = (result: Vm[]) => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(result),
    };
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(qb) };
    return { qb, useCase: new GetVmPrioritiesUseCase(repository as any) };
  };

  it('joins the server, skips vCenter-hosted VMs and orders by priority then name', async () => {
    const { useCase, qb } = build(vms);

    await useCase.execute('admin-1');

    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('vm.server', 'server');
    expect(qb.where).toHaveBeenCalledWith('server.type != :type', {
      type: 'vcenter',
    });
    expect(qb.orderBy).toHaveBeenCalledWith('vm.priority', 'ASC');
    expect(qb.addOrderBy).toHaveBeenCalledWith('vm.name', 'ASC');
  });

  it('maps VMs to the priority response, keeping null values', async () => {
    const { useCase } = build(vms);

    await expect(useCase.execute('admin-1')).resolves.toEqual([
      { id: 'vm-2', name: 'db', serverId: 'server-1', priority: 1, state: 'poweredOn' },
      { id: 'vm-1', name: 'web', serverId: 'server-2', priority: 1, state: null },
    ]);
  });

  it('returns an empty list when there is no VM', async () => {
    const { useCase } = build([]);

    await expect(useCase.execute('admin-1')).resolves.toEqual([]);
  });
});
