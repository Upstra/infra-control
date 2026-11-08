import { BulkCreateUseCase } from '../bulk-create.use-case';

/**
 * A vCenter may be sent without priority (the DTO allows it) but the column
 * is NOT NULL: the demo seed's vCenter made /setup/bulk-create-with-discovery
 * fail with "null value in column priority".
 */
describe('BulkCreateUseCase.assignMissingPriorities', () => {
  const useCase = new BulkCreateUseCase(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
  const runner = (existingMax: number | null) =>
    ({
      manager: {
        getRepository: () => ({
          maximum: jest.fn().mockResolvedValue(existingMax),
        }),
      },
    }) as any;
  const assign = (servers: any[], existingMax: number | null = null) =>
    (useCase as any).assignMissingPriorities(runner(existingMax), servers);

  it('puts a vCenter without priority after the batch', async () => {
    const servers = [
      { name: 'vCenter', type: 'vcenter' },
      { name: 'esxi-1', type: 'esxi', priority: 2 },
      { name: 'esxi-2', type: 'esxi', priority: 4 },
    ];
    await assign(servers);
    expect(servers[0]).toMatchObject({ priority: 5 });
  });

  it('also stays after servers already in the database', async () => {
    const servers = [
      { name: 'vCenter', type: 'vcenter' },
      { name: 'esxi-1', type: 'esxi', priority: 1 },
    ];
    await assign(servers, 7);
    expect(servers[0]).toMatchObject({ priority: 8 });
  });

  it('gives several missing priorities distinct consecutive slots', async () => {
    const servers: any[] = [{ type: 'vcenter' }, { type: 'vcenter', priority: null }];
    await assign(servers);
    expect(servers.map((s) => s.priority)).toEqual([1, 2]);
  });

  it('leaves explicit priorities untouched', async () => {
    const servers = [{ type: 'esxi', priority: 3 }];
    await assign(servers, 9);
    expect(servers[0].priority).toBe(3);
  });
});
