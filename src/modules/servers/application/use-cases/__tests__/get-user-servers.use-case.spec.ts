import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { GetUserServersUseCase } from '../get-user-servers.use-case';
import { ServerResponseDto } from '../../dto/server.response.dto';

describe('GetUserServersUseCase', () => {
  let useCase: GetUserServersUseCase;
  let userRepo: any;
  let permissionRepo: any;
  let serverRepo: any;

  beforeEach(() => {
    userRepo = { findOneByField: jest.fn() };
    permissionRepo = { findAllByField: jest.fn() };
    serverRepo = { findAllByField: jest.fn(), findAll: jest.fn() };

    useCase = new GetUserServersUseCase(userRepo, permissionRepo, serverRepo);
  });

  it('should return [] if user has no role', async () => {
    userRepo.findOneByField.mockResolvedValue({ id: 'user-1', roles: [] });

    const result = await useCase.execute('user-1');
    expect(result).toEqual([]);
  });

  it('should return [] if no permissions found', async () => {
    userRepo.findOneByField.mockResolvedValue({
      id: 'user-2',
      roles: [{ id: 'role-2' }],
    });
    permissionRepo.findAllByField.mockResolvedValue([]);

    const result = await useCase.execute('user-2');
    expect(result).toEqual([]);
  });

  it('should return [] if user has no READ permissions', async () => {
    userRepo.findOneByField.mockResolvedValue({
      id: 'user-3',
      roles: [{ id: 'role-3' }],
    });

    permissionRepo.findAllByField.mockResolvedValue([
      { serverId: 'srv-1', bitmask: PermissionBit.WRITE },
      { serverId: 'srv-2', bitmask: PermissionBit.WRITE },
    ]);

    const result = await useCase.execute('user-3');
    expect(result).toEqual([]);
  });

  it('should return [] if READ permissions point only to null serverIds', async () => {
    userRepo.findOneByField.mockResolvedValue({
      id: 'user-4',
      roles: [{ id: 'role-4' }],
    });
    permissionRepo.findAllByField.mockResolvedValue([
      { serverId: null, bitmask: PermissionBit.READ },
      { serverId: null, bitmask: PermissionBit.READ | PermissionBit.WRITE },
    ]);

    const result = await useCase.execute('user-4');
    expect(result).toEqual([]);
  });

  it('should return servers if READ permissions and servers found', async () => {
    userRepo.findOneByField.mockResolvedValue({
      id: 'user-5',
      roles: [{ id: 'role-5' }],
    });
    permissionRepo.findAllByField.mockResolvedValue([
      { serverId: 'srv-42', bitmask: PermissionBit.READ },
      { serverId: 'srv-43', bitmask: PermissionBit.READ | PermissionBit.WRITE },
    ]);

    serverRepo.findAllByField.mockResolvedValue([
      { id: 'srv-42', name: 'Serveur 42' },
      { id: 'srv-43', name: 'Serveur 43' },
    ]);

    jest
      .spyOn(ServerResponseDto, 'fromEntity')
      .mockImplementation((s: any) => ({ id: s.id, name: s.name }) as any);

    const result = await useCase.execute('user-5');
    expect(result).toEqual([
      { id: 'srv-42', name: 'Serveur 42' },
      { id: 'srv-43', name: 'Serveur 43' },
    ]);
    expect(serverRepo.findAllByField).toHaveBeenCalledWith({
      field: 'id',
      value: ['srv-42', 'srv-43'],
      relations: ['ilo'],
    });
  });

  it('should return [] if an error is thrown by repo', async () => {
    userRepo.findOneByField.mockResolvedValue({
      id: 'user-6',
      roles: [{ id: 'role-6' }],
    });
    permissionRepo.findAllByField.mockResolvedValue([
      { serverId: 'srv-99', bitmask: PermissionBit.READ },
    ]);
    serverRepo.findAllByField.mockRejectedValue(new Error('DB crashed'));

    const result = await useCase.execute('user-6');
    expect(result).toEqual([]);
  });
});
