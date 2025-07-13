import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ValidateIpUseCase } from '../validate-ip.use-case';
import { Ups } from '@/modules/ups/domain/entities/ups.entity';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { Ilo } from '@/modules/ilos/domain/entities/ilo.entity';
import { IpValidationRequestDto } from '../../dto/ip-validation.dto';

describe('ValidateIpUseCase', () => {
  let useCase: ValidateIpUseCase;
  let upsRepository: jest.Mocked<Repository<Ups>>;
  let serverRepository: jest.Mocked<Repository<Server>>;
  let iloRepository: jest.Mocked<Repository<Ilo>>;

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateIpUseCase,
        {
          provide: getRepositoryToken(Ups),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Server),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Ilo),
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<ValidateIpUseCase>(ValidateIpUseCase);
    upsRepository = module.get(getRepositoryToken(Ups));
    serverRepository = module.get(getRepositoryToken(Server));
    iloRepository = module.get(getRepositoryToken(Ilo));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return exists: false when IP is empty', async () => {
      const dto: IpValidationRequestDto = {
        ip: '',
        resourceType: 'server',
      };

      const result = await useCase.execute(dto);

      expect(result).toEqual({ exists: false });
      expect(upsRepository.findOne).not.toHaveBeenCalled();
      expect(serverRepository.findOne).not.toHaveBeenCalled();
      expect(iloRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return exists: false when IP is only whitespace', async () => {
      const dto: IpValidationRequestDto = {
        ip: '   ',
        resourceType: 'server',
      };

      const result = await useCase.execute(dto);

      expect(result).toEqual({ exists: false });
    });

    it('should validate UPS IP and return conflict when exists', async () => {
      const dto: IpValidationRequestDto = {
        ip: '192.168.1.100',
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
        where: { ip: '192.168.1.100' },
        select: ['id', 'name'],
      });
    });

    it('should validate server IP and return conflict when exists', async () => {
      const dto: IpValidationRequestDto = {
        ip: '192.168.1.50',
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
        where: { ip: '192.168.1.50' },
        select: ['id', 'name'],
      });
    });

    it('should validate iLO IP and return conflict when exists', async () => {
      const dto: IpValidationRequestDto = {
        ip: '192.168.1.200',
        resourceType: 'ilo',
      };

      const existingIlo = { id: 'ilo-1', name: 'iLO-WEB-01' };
      iloRepository.findOne.mockResolvedValue(existingIlo as any);

      const result = await useCase.execute(dto);

      expect(result).toEqual({
        exists: true,
        conflictsWith: 'iLO "iLO-WEB-01"',
      });
      expect(iloRepository.findOne).toHaveBeenCalledWith({
        where: { ip: '192.168.1.200' },
        select: ['id', 'name'],
      });
    });

    it('should return exists: false when IP is available', async () => {
      const dto: IpValidationRequestDto = {
        ip: '192.168.1.99',
        resourceType: 'server',
      };

      serverRepository.findOne.mockResolvedValue(null);

      const result = await useCase.execute(dto);

      expect(result).toEqual({ exists: false });
      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { ip: '192.168.1.99' },
        select: ['id', 'name'],
      });
    });

    it('should exclude specified ID from validation', async () => {
      const dto: IpValidationRequestDto = {
        ip: '192.168.1.100',
        resourceType: 'ups',
        excludeId: 'ups-1',
      };

      const existingUps = { id: 'ups-1', name: 'UPS-Primary' };
      upsRepository.findOne.mockResolvedValue(null); // No conflict after exclusion

      const result = await useCase.execute(dto);

      expect(result).toEqual({ exists: false });
      expect(upsRepository.findOne).toHaveBeenCalledWith({
        where: { ip: '192.168.1.100', id: Not('ups-1') },
        select: ['id', 'name'],
      });
    });

    it('should trim IP address before validation', async () => {
      const dto: IpValidationRequestDto = {
        ip: '  192.168.1.100  ',
        resourceType: 'server',
      };

      serverRepository.findOne.mockResolvedValue(null);

      await useCase.execute(dto);

      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { ip: '192.168.1.100' },
        select: ['id', 'name'],
      });
    });
  });

  describe('validateIp (legacy method)', () => {
    it('should call execute with default server resource type', async () => {
      const executeSpy = jest.spyOn(useCase, 'execute');
      executeSpy.mockResolvedValue({ exists: false });

      await useCase.validateIp('192.168.1.100');

      expect(executeSpy).toHaveBeenCalledWith({
        ip: '192.168.1.100',
        resourceType: 'server',
      });
    });
  });
});