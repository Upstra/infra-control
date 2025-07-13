import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ValidateNameUseCase } from '../validate-name.use-case';
import { Room } from '@/modules/rooms/domain/entities/room.entity';
import { Ups } from '@/modules/ups/domain/entities/ups.entity';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { NameValidationRequestDto } from '../../dto/ip-validation.dto';

describe('ValidateNameUseCase', () => {
  let useCase: ValidateNameUseCase;
  let roomRepository: jest.Mocked<Repository<Room>>;
  let upsRepository: jest.Mocked<Repository<Ups>>;
  let serverRepository: jest.Mocked<Repository<Server>>;

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateNameUseCase,
        {
          provide: getRepositoryToken(Room),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Ups),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Server),
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<ValidateNameUseCase>(ValidateNameUseCase);
    roomRepository = module.get(getRepositoryToken(Room));
    upsRepository = module.get(getRepositoryToken(Ups));
    serverRepository = module.get(getRepositoryToken(Server));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return exists: false when name is empty', async () => {
      const dto: NameValidationRequestDto = {
        name: '',
        resourceType: 'server',
      };

      const result = await useCase.execute(dto);

      expect(result).toEqual({ exists: false });
      expect(roomRepository.findOne).not.toHaveBeenCalled();
      expect(upsRepository.findOne).not.toHaveBeenCalled();
      expect(serverRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return exists: false when name is only whitespace', async () => {
      const dto: NameValidationRequestDto = {
        name: '   ',
        resourceType: 'server',
      };

      const result = await useCase.execute(dto);

      expect(result).toEqual({ exists: false });
    });

    it('should validate room name and return conflict when exists', async () => {
      const dto: NameValidationRequestDto = {
        name: 'Server Room 1',
        resourceType: 'room',
      };

      const existingRoom = { id: 'room-1', name: 'Server Room 1' };
      roomRepository.findOne.mockResolvedValue(existingRoom as any);

      const result = await useCase.execute(dto);

      expect(result).toEqual({
        exists: true,
        conflictsWith: 'Room "Server Room 1"',
      });
      expect(roomRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Server Room 1' },
        select: ['id', 'name'],
      });
    });

    it('should validate UPS name and return conflict when exists', async () => {
      const dto: NameValidationRequestDto = {
        name: 'UPS-Primary',
        resourceType: 'ups',
      };

      const existingUps = { id: 'ups-1', name: 'UPS-Primary' };
      upsRepository.findOne.mockResolvedValue(existingUps as any);

      const result = await useCase.execute(dto);

      expect(result).toEqual({
        exists: true,
        conflictsWith: 'UPS "UPS-Primary"',
      });
      expect(upsRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'UPS-Primary' },
        select: ['id', 'name'],
      });
    });

    it('should validate server name and return conflict when exists', async () => {
      const dto: NameValidationRequestDto = {
        name: 'WEB-01',
        resourceType: 'server',
      };

      const existingServer = { id: 'server-1', name: 'WEB-01' };
      serverRepository.findOne.mockResolvedValue(existingServer as any);

      const result = await useCase.execute(dto);

      expect(result).toEqual({
        exists: true,
        conflictsWith: 'Server "WEB-01"',
      });
      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'WEB-01' },
        select: ['id', 'name'],
      });
    });

    it('should return exists: false when name is available', async () => {
      const dto: NameValidationRequestDto = {
        name: 'New Server',
        resourceType: 'server',
      };

      serverRepository.findOne.mockResolvedValue(null);

      const result = await useCase.execute(dto);

      expect(result).toEqual({ exists: false });
      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'New Server' },
        select: ['id', 'name'],
      });
    });

    it('should exclude specified ID from validation', async () => {
      const dto: NameValidationRequestDto = {
        name: 'UPS-Primary',
        resourceType: 'ups',
        excludeId: 'ups-1',
      };

      upsRepository.findOne.mockResolvedValue(null); // No conflict after exclusion

      const result = await useCase.execute(dto);

      expect(result).toEqual({ exists: false });
      expect(upsRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'UPS-Primary', id: Not('ups-1') },
        select: ['id', 'name'],
      });
    });

    it('should trim name before validation', async () => {
      const dto: NameValidationRequestDto = {
        name: '  Server Name  ',
        resourceType: 'server',
      };

      serverRepository.findOne.mockResolvedValue(null);

      await useCase.execute(dto);

      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Server Name' },
        select: ['id', 'name'],
      });
    });
  });

  describe('validateName (legacy method)', () => {
    it('should call execute with provided parameters', async () => {
      const executeSpy = jest.spyOn(useCase, 'execute');
      executeSpy.mockResolvedValue({ exists: false });

      await useCase.validateName('Test Server', 'server');

      expect(executeSpy).toHaveBeenCalledWith({
        name: 'Test Server',
        resourceType: 'server',
      });
    });

    it('should handle UPS resource type', async () => {
      const executeSpy = jest.spyOn(useCase, 'execute');
      executeSpy.mockResolvedValue({ exists: false });

      await useCase.validateName('Test UPS', 'ups');

      expect(executeSpy).toHaveBeenCalledWith({
        name: 'Test UPS',
        resourceType: 'ups',
      });
    });
  });
});