import { RoomRepositoryInterface } from './../../../../rooms/domain/interfaces/room.repository.interface';
import { CreateServerUseCase } from '../create-server.use-case';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { CreateIloUseCase } from '@/modules/ilos/application/use-cases';
import { ServerDomainService } from '@/modules/servers/domain/services/server.domain.service';
import {
  createMockServer,
  createMockServerCreationDto,
} from '@/modules/servers/__mocks__/servers.mock';
import { createMockIloResponseDto } from '@/modules/ilos/__mocks__/ilo.mock';
import { createMockJwtPayload } from '@/core/__mocks__/jwt-payload.mock';
import { GroupRepository } from '@/modules/groups/infrastructure/repositories/group.repository';
import { UpsRepositoryInterface } from '@/modules/ups/domain/interfaces/ups.repository.interface';

import { NotFoundException, BadRequestException } from '@nestjs/common';
import { mockRoom } from '@/modules/rooms/__mocks__/room.mock';
import { createMockGroup } from '@/modules/groups/__mocks__/group.mock';
import { RoomNotFoundException } from '@/modules/rooms/domain/exceptions/room.exception';
import { GroupNotFoundException } from '@/modules/groups/domain/exceptions/group.exception';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { RequestContextDto } from '@/core/dto';

jest.mock('@/modules/ilos/application/use-cases');

describe('CreateServerUseCase', () => {
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
    } as any;

    domain = new ServerDomainService();
    iloUseCase = {
      execute: jest.fn(),
    } as any;

    roomRepo = {
      findRoomById: jest.fn().mockResolvedValue(mockRoom()),
    } as any;

    groupRepo = {
      findById: jest.fn().mockResolvedValue(createMockGroup()),
    } as any;

    upsRepo = {
      findUpsById: jest.fn().mockResolvedValue({ roomId: 'room-uuid' }),
    } as any;

    userRepo = {
      findOneByField: jest.fn(),
    } as any;

    permissionRepo = {
      findOneByField: jest.fn(),
    } as any;

    logHistory = {
      execute: jest.fn(),
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

  describe('Success cases', () => {
    it('should create a server with groupId and return ServerResponseDto', async () => {
      const dto = createMockServerCreationDto();
      const mockServer = createMockServer();
      const mockIloDto = createMockIloResponseDto({
        name: 'ILO-Test',
        ip: '10.0.0.1',
      });

      repo.save.mockResolvedValue(mockServer);
      iloUseCase.execute.mockResolvedValue(mockIloDto);

      const result = await useCase.execute(dto, mockPayload.userId);

      expect(roomRepo.findRoomById).toHaveBeenCalledWith(dto.roomId);
      expect(groupRepo.findById).toHaveBeenCalledWith(dto.groupId);
      expect(repo.save).toHaveBeenCalled();
      expect(iloUseCase.execute).toHaveBeenCalledWith(dto.ilo);
      expect(result).toBeInstanceOf(Object);
      expect(result.name).toBe(mockServer.name);
      expect(result.ilo).toEqual(mockIloDto);
    });

    it('should create a server without groupId and return ServerResponseDto', async () => {
      const dto = createMockServerCreationDto();
      const dtoWithoutGroup = { ...dto, groupId: undefined };
      const mockServer = createMockServer();
      const mockIloDto = createMockIloResponseDto({
        name: 'ILO-Test',
        ip: '10.0.0.1',
      });

      repo.save.mockResolvedValue(mockServer);
      iloUseCase.execute.mockResolvedValue(mockIloDto);

      const result = await useCase.execute(dtoWithoutGroup, mockPayload.userId);

      expect(roomRepo.findRoomById).toHaveBeenCalledWith(
        dtoWithoutGroup.roomId,
      );
      expect(groupRepo.findById).not.toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
      expect(iloUseCase.execute).toHaveBeenCalledWith(dtoWithoutGroup.ilo);
      expect(result).toBeInstanceOf(Object);
      expect(result.name).toBe(mockServer.name);
      expect(result.ilo).toEqual(mockIloDto);
    });
  });

  describe('Room validation errors', () => {
    it('should throw RoomNotFoundException when room does not exist', async () => {
      const dto = createMockServerCreationDto();
      const roomError = new RoomNotFoundException('invalid-room-id');

      roomRepo.findRoomById.mockRejectedValue(roomError);

      await expect(useCase.execute(dto, mockPayload.userId)).rejects.toThrow(
        RoomNotFoundException,
      );
      expect(roomRepo.findRoomById).toHaveBeenCalledWith(dto.roomId);
      expect(groupRepo.findById).not.toHaveBeenCalled();
      expect(iloUseCase.execute).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('Group validation errors', () => {
    it('should throw GroupNotFoundException when group does not exist', async () => {
      const dto = createMockServerCreationDto();
      const groupError = new GroupNotFoundException('server', dto.groupId);

      roomRepo.findRoomById.mockResolvedValue(mockRoom());
      groupRepo.findById.mockRejectedValue(groupError);

      await expect(useCase.execute(dto, mockPayload.userId)).rejects.toThrow(
        GroupNotFoundException,
      );
      expect(roomRepo.findRoomById).toHaveBeenCalledWith(dto.roomId);
      expect(groupRepo.findById).toHaveBeenCalledWith(dto.groupId);
      expect(iloUseCase.execute).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('UPS validation errors', () => {
    it('should throw BadRequestException when UPS and room mismatch', async () => {
      const dto = createMockServerCreationDto({
        upsId: 'ups-1',
        roomId: 'room-uuid',
      });

      roomRepo.findRoomById.mockResolvedValue(mockRoom());
      upsRepo.findUpsById.mockResolvedValue({ roomId: 'other-room' } as any);

      await expect(useCase.execute(dto, mockPayload.userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(upsRepo.findUpsById).toHaveBeenCalledWith(dto.upsId);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('ILO creation errors', () => {
    it('should throw NotFoundException if ilo creation returns null', async () => {
      const dto = createMockServerCreationDto();

      roomRepo.findRoomById.mockResolvedValue(mockRoom());
      groupRepo.findById.mockResolvedValue(createMockGroup());
      iloUseCase.execute.mockResolvedValue(null);

      await expect(useCase.execute(dto, mockPayload.userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute(dto, mockPayload.userId)).rejects.toThrow(
        'Failed to create or retrieve the iLO entity',
      );

      expect(roomRepo.findRoomById).toHaveBeenCalledWith(dto.roomId);
      expect(groupRepo.findById).toHaveBeenCalledWith(dto.groupId);
      expect(iloUseCase.execute).toHaveBeenCalledWith(dto.ilo);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should throw error if ilo creation fails', async () => {
      const dto = createMockServerCreationDto();
      const iloError = new Error('ILO creation failed');

      roomRepo.findRoomById.mockResolvedValue(mockRoom());
      groupRepo.findById.mockResolvedValue(createMockGroup());
      iloUseCase.execute.mockRejectedValue(iloError);

      await expect(useCase.execute(dto, mockPayload.userId)).rejects.toThrow(
        'ILO creation failed',
      );
      expect(roomRepo.findRoomById).toHaveBeenCalledWith(dto.roomId);
      expect(groupRepo.findById).toHaveBeenCalledWith(dto.groupId);
      expect(iloUseCase.execute).toHaveBeenCalledWith(dto.ilo);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('Server save errors', () => {
    it('should throw error if server save fails', async () => {
      const dto = createMockServerCreationDto();
      const mockIloDto = createMockIloResponseDto();
      const saveError = new Error('Database save failed');

      roomRepo.findRoomById.mockResolvedValue(mockRoom());
      groupRepo.findById.mockResolvedValue(createMockGroup());
      iloUseCase.execute.mockResolvedValue(mockIloDto);
      repo.save.mockRejectedValue(saveError);

      await expect(useCase.execute(dto, mockPayload.userId)).rejects.toThrow(
        'Database save failed',
      );
      expect(roomRepo.findRoomById).toHaveBeenCalledWith(dto.roomId);
      expect(groupRepo.findById).toHaveBeenCalledWith(dto.groupId);
      expect(iloUseCase.execute).toHaveBeenCalledWith(dto.ilo);
      expect(repo.save).toHaveBeenCalled();
    });
  });

  it('should create a permission for the user if user has roleId', async () => {
    const dto = createMockServerCreationDto();
    const mockServer = createMockServer();
    const mockIloDto = createMockIloResponseDto({
      name: 'ILO-Test',
      ip: '10.0.0.1',
    });
    // Simule un user AVEC roleId
    const mockUser = createMockUser({
      id: 'user-123',
      roles: [{ id: 'role-42', isAdmin: true }],
    });

    roomRepo.findRoomById.mockResolvedValue(mockRoom());
    groupRepo.findById.mockResolvedValue(createMockGroup());
    iloUseCase.execute.mockResolvedValue(mockIloDto);
    repo.save.mockResolvedValue(mockServer);
    userRepo.findOneByField.mockResolvedValue(mockUser);
    permissionRepo.createPermission = jest.fn();

    await useCase.execute(dto, mockPayload.userId);

    expect(userRepo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: mockPayload.userId,
      relations: ['roles'],
    });
    expect(permissionRepo.createPermission).toHaveBeenCalledWith(
      mockServer.id,
      mockUser.roles[0].id,
      expect.any(Number),
    );
  });

  it('should NOT create a permission if user has no roleId', async () => {
    const dto = createMockServerCreationDto();
    const mockServer = createMockServer();
    const mockIloDto = createMockIloResponseDto({
      name: 'ILO-Test',
      ip: '10.0.0.1',
    });

    roomRepo.findRoomById.mockResolvedValue(mockRoom());
    groupRepo.findById.mockResolvedValue(createMockGroup());
    iloUseCase.execute.mockResolvedValue(mockIloDto);
    repo.save.mockResolvedValue(mockServer);
    userRepo.findOneByField.mockResolvedValue(createMockUser({ roles: [] }));
    permissionRepo.createPermission = jest.fn();

    await useCase.execute(dto, mockPayload.userId);

    expect(userRepo.findOneByField).toHaveBeenCalled();
    expect(permissionRepo.createPermission).not.toHaveBeenCalled();
  });

  it('should keep existing permissions when creating multiple servers', async () => {
    const dto1 = createMockServerCreationDto({ ip: '10.0.0.1' });
    const dto2 = createMockServerCreationDto({ ip: '10.0.0.2' });
    const server1 = createMockServer({ id: 'srv-1' });
    const server2 = createMockServer({ id: 'srv-2' });
    const mockIloDto = createMockIloResponseDto();
    const mockUser = createMockUser({
      roles: [{ id: 'role-42', isAdmin: true }],
    });

    roomRepo.findRoomById.mockResolvedValue(mockRoom());
    groupRepo.findById.mockResolvedValue(createMockGroup());
    iloUseCase.execute.mockResolvedValue(mockIloDto);
    repo.save.mockResolvedValueOnce(server1).mockResolvedValueOnce(server2);
    userRepo.findOneByField.mockResolvedValue(mockUser);
    permissionRepo.createPermission = jest.fn();

    await useCase.execute(dto1, mockPayload.userId);
    await useCase.execute(dto2, mockPayload.userId);

    expect(permissionRepo.createPermission).toHaveBeenCalledTimes(2);
    expect(permissionRepo.createPermission).toHaveBeenNthCalledWith(
      1,
      server1.id,
      mockUser.roles[0].id,
      expect.any(Number),
    );
    expect(permissionRepo.createPermission).toHaveBeenNthCalledWith(
      2,
      server2.id,
      mockUser.roles[0].id,
      expect.any(Number),
    );
  });

  describe('Structured Logging', () => {
    const requestContext = RequestContextDto.forTesting({
      ipAddress: '203.0.113.1',
      userAgent: 'Admin-Panel/2.0',
    });

    it('should log server creation with structured data', async () => {
      const dto = createMockServerCreationDto();
      const mockServer = createMockServer();
      const mockIloDto = createMockIloResponseDto({
        name: 'ILO-Test',
        ip: '10.0.0.1',
      });
      const mockUser = createMockUser({
        id: 'user-123',
        roles: [{ id: 'role-42', name: 'ADMIN', isAdmin: true }],
      });
      const mockRoomData = mockRoom();
      const mockGroupData = createMockGroup();

      repo.save.mockResolvedValue(mockServer);
      iloUseCase.execute.mockResolvedValue(mockIloDto);
      userRepo.findOneByField.mockResolvedValue(mockUser);
      roomRepo.findRoomById.mockResolvedValue(mockRoomData);
      groupRepo.findById.mockResolvedValue(mockGroupData);
      permissionRepo.createPermission = jest.fn();

      await useCase.execute(dto, mockPayload.userId, requestContext);

      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'server',
        entityId: mockServer.id,
        action: 'CREATE',
        userId: mockPayload.userId,
        newValue: {
          hostname: mockServer.name,
          description: undefined,
          roomId: mockServer.roomId,
          roomName: mockRoomData.name,
          groupId: mockServer.groupId,
          groupName: mockGroupData.name,
          upsId: mockServer.upsId,
          iloId: mockServer.iloId,
          iloIpAddress: mockIloDto.ip,
        },
        metadata: {
          serverType: 'esxi',
          hasUpsConnection: !!dto.upsId,
          assignedToGroup: !!dto.groupId,
          adminRolesGranted: 1,
          iloConfigured: true,
          initialPermissions: [
            'READ',
            'WRITE',
            'DELETE',
            'SHUTDOWN',
            'RESTART',
          ],
        },
        ipAddress: '203.0.113.1',
        userAgent: 'Admin-Panel/2.0',
      });
    });

    it('should log server creation without group and UPS', async () => {
      const dto = createMockServerCreationDto();
      const dtoWithoutOptionals = {
        ...dto,
        groupId: undefined,
        upsId: undefined,
      };
      const mockServer = createMockServer({ groupId: null, upsId: null });
      const mockIloDto = createMockIloResponseDto();
      const mockUser = createMockUser({
        roles: [{ id: 'role-42', name: 'USER', isAdmin: false }],
      });
      const mockRoomData = mockRoom();

      repo.save.mockResolvedValue(mockServer);
      iloUseCase.execute.mockResolvedValue(mockIloDto);
      userRepo.findOneByField.mockResolvedValue(mockUser);
      roomRepo.findRoomById.mockResolvedValue(mockRoomData);
      permissionRepo.createPermission = jest.fn();

      await useCase.execute(
        dtoWithoutOptionals,
        mockPayload.userId,
        requestContext,
      );

      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'server',
        entityId: mockServer.id,
        action: 'CREATE',
        userId: mockPayload.userId,
        newValue: {
          hostname: mockServer.name,
          description: undefined,
          roomId: mockServer.roomId,
          roomName: mockRoomData.name,
          groupId: mockServer.groupId,
          groupName: undefined,
          upsId: mockServer.upsId,
          iloId: mockServer.iloId,
          iloIpAddress: mockIloDto.ip,
        },
        metadata: {
          serverType: 'esxi',
          hasUpsConnection: false,
          assignedToGroup: false,
          adminRolesGranted: 0,
          iloConfigured: true,
          initialPermissions: [
            'READ',
            'WRITE',
            'DELETE',
            'SHUTDOWN',
            'RESTART',
          ],
        },
        ipAddress: '203.0.113.1',
        userAgent: 'Admin-Panel/2.0',
      });
    });

    it('should work without request context', async () => {
      const dto = createMockServerCreationDto();
      const mockServer = createMockServer();
      const mockIloDto = createMockIloResponseDto();
      const mockUser = createMockUser({ roles: [] });

      repo.save.mockResolvedValue(mockServer);
      iloUseCase.execute.mockResolvedValue(mockIloDto);
      userRepo.findOneByField.mockResolvedValue(mockUser);
      roomRepo.findRoomById.mockResolvedValue(mockRoom());
      groupRepo.findById.mockResolvedValue(createMockGroup());
      permissionRepo.createPermission = jest.fn();

      await useCase.execute(dto, mockPayload.userId);

      expect(logHistory.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: undefined,
          userAgent: undefined,
        }),
      );
    });
  });
});
