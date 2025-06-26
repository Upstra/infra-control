import { mockRoom, mockRoomRepository } from '@/modules/rooms/__mocks__';
import { GetRoomByIdUseCase } from '@/modules/rooms/application/use-cases';
import { RoomRepositoryInterface } from '@/modules/rooms/domain/interfaces/room.repository.interface';
import { createMockServer } from '@/modules/servers/__mocks__/servers.mock';
import { createMockPermissionServer } from '@/modules/permissions/__mocks__/permissions.mock';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';

describe('GetRoomByIdUseCase', () => {
  it('filters servers based on user permissions', async () => {
    const roomRepository =
      mockRoomRepository() as jest.Mocked<RoomRepositoryInterface>;
    const permissionRepo: jest.Mocked<PermissionServerRepositoryInterface> = {
      findAllByField: jest.fn(),
      findPermissionByIds: jest.fn(),
      updatePermission: jest.fn(),
      deletePermission: jest.fn(),
      createPermission: jest.fn(),
      deleteByRoleAndServerIds: jest.fn(),
      findOneByField: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
    } as any;
    const userRepo: jest.Mocked<UserRepositoryInterface> = {
      findOneByField: jest.fn(),
      findOneById: jest.fn(),
      updateFields: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    } as any;

    const useCase = new GetRoomByIdUseCase(
      roomRepository,
      permissionRepo,
      userRepo,
    );

    const server1 = createMockServer({ id: 's1' });
    const server2 = createMockServer({ id: 's2' });
    const room = mockRoom({ servers: [server1, server2] });
    const roomId = 'room-id';

    roomRepository.findRoomById.mockResolvedValue(room);
    userRepo.findOneByField.mockResolvedValue(
      createMockUser({ roleId: 'role-1' }),
    );
    permissionRepo.findAllByField.mockResolvedValue([
      createMockPermissionServer({
        roleId: 'role-1',
        serverId: 's1',
        bitmask: PermissionBit.READ,
      }),
    ]);

    const result = await useCase.execute(roomId, 'user-1');

    expect(roomRepository.findRoomById).toHaveBeenCalledWith(roomId);
    expect(permissionRepo.findAllByField).toHaveBeenCalled();
    expect(result.servers?.length).toBe(1);
    expect(result.servers?.[0].id).toBe('s1');
  });
});
