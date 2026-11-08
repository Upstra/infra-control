import { StartVMDiscoveryUseCase } from '../start-vm-discovery.use-case';

const server = (id: string, type: string) => ({ id, name: id, type }) as any;

describe('StartVMDiscoveryUseCase', () => {
  const vcenter = server('vc', 'vcenter');
  const esxi1 = server('esxi-1', 'esxi');
  const esxi2 = server('esxi-2', 'esxi');

  const build = (all: any[]) => {
    const discovery = {
      discoverVmsFromVCenter: jest.fn().mockResolvedValue({}),
      discoverVmsFromServers: jest.fn().mockResolvedValue({}),
    };
    const repository = {
      findAllWithCredentials: jest.fn().mockResolvedValue(all),
      findServerByIdWithCredentials: jest.fn(
        async (id: string) => all.find((s) => s.id === id) ?? null,
      ),
    };
    const useCase = new StartVMDiscoveryUseCase(
      discovery as any,
      repository as any,
    );
    return { useCase, discovery, repository };
  };

  it('goes through the vCenter when there is one, like the setup wizard', async () => {
    const { useCase, discovery } = build([vcenter, esxi1, esxi2]);

    const result = await useCase.execute({});

    expect(discovery.discoverVmsFromVCenter).toHaveBeenCalledWith(
      vcenter,
      [esxi1, esxi2],
      result.sessionId,
    );
    expect(discovery.discoverVmsFromServers).not.toHaveBeenCalled();
    expect(result.serverCount).toBe(1);
  });

  it('retrying the vCenter alone still maps VMs onto every ESXi', async () => {
    const { useCase, discovery } = build([vcenter, esxi1, esxi2]);

    await useCase.execute({ serverIds: ['vc'] });

    expect(discovery.discoverVmsFromVCenter).toHaveBeenCalledWith(
      vcenter,
      [esxi1, esxi2],
      expect.any(String),
    );
  });

  it('falls back to querying each ESXi when no vCenter is configured', async () => {
    const { useCase, discovery } = build([esxi1, esxi2]);

    const result = await useCase.execute({});

    expect(discovery.discoverVmsFromServers).toHaveBeenCalledWith(
      [esxi1, esxi2],
      result.sessionId,
    );
    expect(result.serverCount).toBe(2);
  });

  it('accepts UUID server ids as strings', async () => {
    const { useCase, repository } = build([esxi1]);

    await useCase.execute({ serverIds: ['esxi-1'] });

    expect(repository.findServerByIdWithCredentials).toHaveBeenCalledWith(
      'esxi-1',
    );
  });
});
