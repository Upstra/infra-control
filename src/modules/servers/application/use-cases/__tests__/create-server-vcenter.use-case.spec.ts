import { CreateServerUseCase } from '../create-server.use-case';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { CreateIloUseCase } from '@/modules/ilos/application/use-cases';
import { ServerDomainService } from '@/modules/servers/domain/services/server.domain.service';
import { createMockServerCreationDto } from '@/modules/servers/__mocks__/servers.mock';
import { createMockJwtPayload } from '@/core/__mocks__/jwt-payload.mock';
import { GroupRepository } from '@/modules/groups/infrastructure/repositories/group.repository';
import { UpsRepositoryInterface } from '@/modules/ups/domain/interfaces/ups.repository.interface';
import { RoomRepositoryInterface } from './../../../../rooms/domain/interfaces/room.repository.interface';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { mockRoom } from '@/modules/rooms/__mocks__/room.mock';
import { BadRequestException } from '@nestjs/common';
import { DuplicateServerPriorityException } from '@/modules/servers/domain/exceptions/duplicate-priority.exception';

describe('CreateServerUseCase - vCenter validation', () => {
  let useCase: CreateServerUseCase;
  let repo: jest.Mocked<ServerRepositoryInterface>;
  let domain: ServerDomainService;
  let iloUseCase: jest.Mocked<CreateIloUseCase>;
  let roomRepo: jest.Mocked<RoomRepositoryInterface>;
  let groupRepo: jest.Mocked<GroupRepository>;
  let upsRepo: jest.Mocked<UpsRepositoryInterface>;
  let userRepo: jest.Mocked<UserRepositoryInterface>;
  let permissionRepo: jest.Mocked<PermissionServerRepositoryInterface>;
  let logHistory: jest.Mocked<LogHistoryUseCase>;

  const mockPayload = createMockJwtPayload();

  beforeEach(() => {
    repo = {
      save: jest.fn(),
      findOneByField: jest.fn(),
    } as any;

    domain = new ServerDomainService();
    iloUseCase = {
      execute: jest.fn(),
    } as any;

    roomRepo = {
      findRoomById: jest.fn(),
    } as any;

    groupRepo = {
      findById: jest.fn(),
    } as any;

    upsRepo = {
      findUpsById: jest.fn(),
    } as any;

    userRepo = {
      findById: jest.fn(),
      findOneByField: jest.fn(),
    } as any;

    permissionRepo = {
      createFromServer: jest.fn(),
      updateUserPermissions: jest.fn(),
    } as any;

    logHistory = {
      logEvent: jest.fn(),
      executeStructured: jest.fn(),
    } as any;

    useCase = new CreateServerUseCase(
      repo,
      iloUseCase,
      domain,
      roomRepo,
      groupRepo,
      upsRepo,
      userRepo,
      permissionRepo,
      logHistory,
    );
  });

  describe('vCenter server creation', () => {
    it('should create a vCenter server without priority', async () => {
      const dto = createMockServerCreationDto({
        type: 'vcenter',
        priority: undefined,
        ilo: undefined,
        upsId: undefined,
      });

      const testRoom = mockRoom({ id: dto.roomId, name: 'Test Room' });
      roomRepo.findRoomById.mockResolvedValue(testRoom);
      repo.save.mockResolvedValue({
        id: '123',
        ...dto,
        priority: null,
        room: testRoom,
      } as any);

      const result = await useCase.execute(dto, mockPayload.userId);

      expect(repo.findOneByField).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('123');
    });

    it('should create a vCenter server with priority if provided', async () => {
      const dto = createMockServerCreationDto({
        type: 'vcenter',
        priority: 10,
        ilo: undefined,
        upsId: undefined,
      });

      const testRoom = mockRoom({ id: dto.roomId, name: 'Test Room' });
      roomRepo.findRoomById.mockResolvedValue(testRoom);
      repo.save.mockResolvedValue({
        id: '123',
        ...dto,
        room: testRoom,
      } as any);

      const result = await useCase.execute(dto, mockPayload.userId);

      expect(repo.findOneByField).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.priority).toBe(10);
    });

    it('should not allow vCenter server with iLO configuration', async () => {
      const dto = createMockServerCreationDto({
        type: 'vcenter',
        ilo: {
          name: 'iLO-vCenter',
          ip: '192.168.1.100',
          login: 'admin',
          password: 'password',
        },
        upsId: undefined,
      });

      roomRepo.findRoomById.mockResolvedValue(mockRoom());

      await expect(useCase.execute(dto, mockPayload.userId)).rejects.toThrow(
        new BadRequestException(
          'vCenter servers should not have iLO configuration',
        ),
      );
    });

    it('should check priority uniqueness for non-vCenter servers', async () => {
      const dto = createMockServerCreationDto({
        type: 'esxi',
        priority: 10,
        upsId: undefined,
      });

      roomRepo.findRoomById.mockResolvedValue(mockRoom());
      repo.findOneByField.mockResolvedValue({ id: 'existing-server' } as any);

      await expect(useCase.execute(dto, mockPayload.userId)).rejects.toThrow(
        new DuplicateServerPriorityException(10),
      );

      expect(repo.findOneByField).toHaveBeenCalledWith({
        field: 'priority',
        value: 10,
      });
    });

    it('should require iLO configuration for ESXi servers', async () => {
      const dto = createMockServerCreationDto({
        type: 'esxi',
        priority: 10,
        ilo: undefined,
        upsId: undefined,
      });

      roomRepo.findRoomById.mockResolvedValue(mockRoom());
      repo.findOneByField.mockResolvedValue(null);

      await expect(useCase.execute(dto, mockPayload.userId)).rejects.toThrow(
        new BadRequestException(
          'iLO configuration is required for ESXi servers',
        ),
      );
    });
  });
});
