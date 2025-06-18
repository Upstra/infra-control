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
import { GroupServerRepositoryInterface } from '@/modules/groups/domain/interfaces/group-server.repository.interface';

import { NotFoundException } from '@nestjs/common';
import { mockRoom } from '@/modules/rooms/__mocks__/room.mock';
import { createMockGroupServer } from '@/modules/groups/__mocks__/group.server.mock';
import { RoomNotFoundException } from '@/modules/rooms/domain/exceptions/room.exception';
import { GroupNotFoundException } from '@/modules/groups/domain/exceptions/group.exception';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';

jest.mock('@/modules/ilos/application/use-cases');

describe('CreateServerUseCase', () => {
  let useCase: CreateServerUseCase;
  let repo: jest.Mocked<ServerRepositoryInterface>;
  let domain: ServerDomainService;
  let iloUseCase: jest.Mocked<CreateIloUseCase>;
  let roomRepo: jest.Mocked<RoomRepositoryInterface>;
  let groupRepo: jest.Mocked<GroupServerRepositoryInterface>;
  let userRepo: jest.Mocked<UserRepositoryInterface>;
  let permissionRepo: jest.Mocked<PermissionServerRepositoryInterface>;

  const mockPayload: JwtPayload = {
    userId: 'user-123',
    email: 'john.doe@example.com',
  };

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
      findOneByField: jest.fn().mockResolvedValue(createMockGroupServer()),
    } as any;

    userRepo = {
      findOneByField: jest.fn(),
    } as any;

    permissionRepo = {
      findOneByField: jest.fn(),
    } as any;

    useCase = new CreateServerUseCase(
      repo,
      iloUseCase,
      domain,
      roomRepo,
      groupRepo,
      userRepo,
      permissionRepo,
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
      expect(groupRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: dto.groupId,
      });
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
      expect(groupRepo.findOneByField).not.toHaveBeenCalled();
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
      expect(groupRepo.findOneByField).not.toHaveBeenCalled();
      expect(iloUseCase.execute).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('Group validation errors', () => {
    it('should throw GroupNotFoundException when group does not exist', async () => {
      const dto = createMockServerCreationDto();
      const groupError = new GroupNotFoundException('server', dto.groupId);

      roomRepo.findRoomById.mockResolvedValue(mockRoom());
      groupRepo.findOneByField.mockRejectedValue(groupError);

      await expect(useCase.execute(dto, mockPayload.userId)).rejects.toThrow(
        GroupNotFoundException,
      );
      expect(roomRepo.findRoomById).toHaveBeenCalledWith(dto.roomId);
      expect(groupRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: dto.groupId,
      });
      expect(iloUseCase.execute).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('ILO creation errors', () => {
    it('should throw NotFoundException if ilo creation returns null', async () => {
      const dto = createMockServerCreationDto();

      roomRepo.findRoomById.mockResolvedValue(mockRoom());
      groupRepo.findOneByField.mockResolvedValue(createMockGroupServer());
      iloUseCase.execute.mockResolvedValue(null);

      await expect(useCase.execute(dto, mockPayload.userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute(dto, mockPayload.userId)).rejects.toThrow(
        'Failed to create or retrieve the iLO entity',
      );

      expect(roomRepo.findRoomById).toHaveBeenCalledWith(dto.roomId);
      expect(groupRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: dto.groupId,
      });
      expect(iloUseCase.execute).toHaveBeenCalledWith(dto.ilo);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should throw error if ilo creation fails', async () => {
      const dto = createMockServerCreationDto();
      const iloError = new Error('ILO creation failed');

      roomRepo.findRoomById.mockResolvedValue(mockRoom());
      groupRepo.findOneByField.mockResolvedValue(createMockGroupServer());
      iloUseCase.execute.mockRejectedValue(iloError);

      await expect(useCase.execute(dto, mockPayload.userId)).rejects.toThrow(
        'ILO creation failed',
      );
      expect(roomRepo.findRoomById).toHaveBeenCalledWith(dto.roomId);
      expect(groupRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: dto.groupId,
      });
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
      groupRepo.findOneByField.mockResolvedValue(createMockGroupServer());
      iloUseCase.execute.mockResolvedValue(mockIloDto);
      repo.save.mockRejectedValue(saveError);

      await expect(useCase.execute(dto, mockPayload.userId)).rejects.toThrow(
        'Database save failed',
      );
      expect(roomRepo.findRoomById).toHaveBeenCalledWith(dto.roomId);
      expect(groupRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: dto.groupId,
      });
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
    const mockUser = createMockUser({ id: 'user-123', roleId: 'role-42' });

    roomRepo.findRoomById.mockResolvedValue(mockRoom());
    groupRepo.findOneByField.mockResolvedValue(createMockGroupServer());
    iloUseCase.execute.mockResolvedValue(mockIloDto);
    repo.save.mockResolvedValue(mockServer);
    userRepo.findOneByField.mockResolvedValue(mockUser);
    permissionRepo.createPermission = jest.fn();

    await useCase.execute(dto, mockPayload.userId);

    expect(userRepo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: mockPayload.userId,
      relations: ['role'],
    });
    expect(permissionRepo.createPermission).toHaveBeenCalledWith(
      mockServer.id,
      mockUser.roleId,
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
    groupRepo.findOneByField.mockResolvedValue(createMockGroupServer());
    iloUseCase.execute.mockResolvedValue(mockIloDto);
    repo.save.mockResolvedValue(mockServer);
    userRepo.findOneByField.mockResolvedValue(
      createMockUser({ roleId: undefined, role: undefined }),
    );
    permissionRepo.createPermission = jest.fn();

    await useCase.execute(dto, mockPayload.userId);

    expect(userRepo.findOneByField).toHaveBeenCalled();
    expect(permissionRepo.createPermission).not.toHaveBeenCalled();
  });
});
