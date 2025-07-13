import { Test, TestingModule } from '@nestjs/testing';
import { BulkValidationUseCase } from '../bulk-validation.use-case';
import { RoomRepositoryInterface } from '../../../../rooms/domain/interfaces/room.repository.interface';
import { UpsRepositoryInterface } from '../../../../ups/domain/interfaces/ups.repository.interface';
import { ServerRepositoryInterface } from '../../../../servers/domain/interfaces/server.repository.interface';
import { ValidationRequestDto } from '../../dto';
import { Room } from '../../../../rooms/domain/entities/room.entity';

describe('BulkValidationUseCase', () => {
  let useCase: BulkValidationUseCase;
  let roomRepository: RoomRepositoryInterface;
  let upsRepository: UpsRepositoryInterface;
  let serverRepository: ServerRepositoryInterface;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkValidationUseCase,
        {
          provide: 'RoomRepositoryInterface',
          useValue: {
            findOneByField: jest.fn(),
          },
        },
        {
          provide: 'UpsRepositoryInterface',
          useValue: {
            findOneByField: jest.fn(),
          },
        },
        {
          provide: 'ServerRepositoryInterface',
          useValue: {
            findOneByField: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<BulkValidationUseCase>(BulkValidationUseCase);
    roomRepository = module.get<RoomRepositoryInterface>(
      'RoomRepositoryInterface',
    );
    upsRepository = module.get<UpsRepositoryInterface>(
      'UpsRepositoryInterface',
    );
    serverRepository = module.get<ServerRepositoryInterface>(
      'ServerRepositoryInterface',
    );
  });

  describe('execute', () => {
    const validRequest: ValidationRequestDto = {
      resources: {
        rooms: [
          { name: 'Room 1', tempId: 'temp_room_1' },
          { name: 'Room 2', tempId: 'temp_room_2' },
        ],
        upsList: [
          { name: 'UPS-01', ip: '192.168.1.100', roomId: 'temp_room_1' },
        ],
        servers: [
          {
            name: 'WEB-01',
            state: 'stopped',
            grace_period_on: 30,
            grace_period_off: 30,
            adminUrl: 'https://192.168.1.10',
            ip: '192.168.1.10',
            login: 'admin',
            password: 'password',
            type: 'esxi',
            priority: 1,
            roomId: 'temp_room_1',
          },
        ],
      },
      checkConnectivity: false,
    };

    it('should validate successfully when all resources are valid', async () => {
      jest.spyOn(roomRepository, 'findOneByField').mockResolvedValue(null);
      jest.spyOn(upsRepository, 'findOneByField').mockResolvedValue(null);
      jest.spyOn(serverRepository, 'findOneByField').mockResolvedValue(null);

      const result = await useCase.execute(validRequest);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.connectivityResults).toBeUndefined();
    });

    it('should detect duplicate room names in batch', async () => {
      const requestWithDuplicates: ValidationRequestDto = {
        resources: {
          rooms: [{ name: 'Room 1' }, { name: 'Room 1' }],
          upsList: [],
          servers: [],
        },
      };

      jest.spyOn(roomRepository, 'findOneByField').mockResolvedValue(null);

      const result = await useCase.execute(requestWithDuplicates);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        resource: 'room',
        index: 1,
        field: 'name',
        message: "Duplicate room name 'Room 1' in the batch",
      });
    });

    it('should detect existing rooms in database', async () => {
      const existingRoom = { id: 'existing-id', name: 'Room 1' } as Room;
      jest
        .spyOn(roomRepository, 'findOneByField')
        .mockResolvedValue(existingRoom);

      const result = await useCase.execute({
        resources: {
          rooms: [{ name: 'Room 1' }],
          upsList: [],
          servers: [],
        },
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        resource: 'room',
        index: 0,
        field: 'name',
        message: "Room with name 'Room 1' already exists",
      });
    });

    it('should detect duplicate UPS IPs in batch', async () => {
      const requestWithDuplicateIPs: ValidationRequestDto = {
        resources: {
          rooms: [],
          upsList: [
            { name: 'UPS-01', ip: '192.168.1.100' },
            { name: 'UPS-02', ip: '192.168.1.100' },
          ],
          servers: [],
        },
      };

      jest.spyOn(upsRepository, 'findOneByField').mockResolvedValue(null);

      const result = await useCase.execute(requestWithDuplicateIPs);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        resource: 'ups',
        index: 1,
        field: 'ip',
        message: "Duplicate UPS IP '192.168.1.100' in the batch",
      });
    });

    it('should validate server fields', async () => {
      const invalidServerRequest: ValidationRequestDto = {
        resources: {
          rooms: [],
          upsList: [],
          servers: [
            {
              name: 'WEB-01',
              state: 'stopped',
              grace_period_on: -1,
              grace_period_off: -1,
              adminUrl: 'https://192.168.1.10',
              ip: '192.168.1.10',
              login: 'admin',
              password: 'password',
              type: 'esxi',
              priority: -1,
            },
          ],
        },
      };

      jest.spyOn(serverRepository, 'findOneByField').mockResolvedValue(null);

      const result = await useCase.execute(invalidServerRequest);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContainEqual({
        resource: 'server',
        index: 0,
        field: 'grace_period_on',
        message: 'Grace period on must be positive',
      });
      expect(result.errors).toContainEqual({
        resource: 'server',
        index: 0,
        field: 'grace_period_off',
        message: 'Grace period off must be positive',
      });
      expect(result.errors).toContainEqual({
        resource: 'server',
        index: 0,
        field: 'priority',
        message: 'Priority must be positive',
      });
    });

    it('should generate warnings for high priority values', async () => {
      const highPriorityRequest: ValidationRequestDto = {
        resources: {
          rooms: [],
          upsList: [],
          servers: [
            {
              name: 'WEB-01',
              state: 'stopped',
              grace_period_on: 30,
              grace_period_off: 30,
              adminUrl: 'https://192.168.1.10',
              ip: '192.168.1.10',
              login: 'admin',
              password: 'password',
              type: 'esxi',
              priority: 15,
            },
          ],
        },
      };

      jest.spyOn(serverRepository, 'findOneByField').mockResolvedValue(null);

      const result = await useCase.execute(highPriorityRequest);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toEqual({
        resource: 'server',
        index: 0,
        message:
          'Priority value is very high (> 10), lower values have higher priority',
      });
    });

    it('should validate ILO configuration', async () => {
      const incompleteIloRequest: ValidationRequestDto = {
        resources: {
          rooms: [],
          upsList: [],
          servers: [
            {
              name: 'WEB-01',
              state: 'stopped',
              grace_period_on: 30,
              grace_period_off: 30,
              adminUrl: 'https://192.168.1.10',
              ip: '192.168.1.10',
              login: 'admin',
              password: 'password',
              type: 'esxi',
              priority: 1,
              ilo_ip: '192.168.1.11',
              // Missing ilo_login and ilo_password
            },
          ],
        },
      };

      jest.spyOn(serverRepository, 'findOneByField').mockResolvedValue(null);

      const result = await useCase.execute(incompleteIloRequest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        resource: 'server',
        index: 0,
        field: 'ilo_ip',
        message: 'ILO IP provided but credentials are missing',
      });
    });

    it('should check connectivity when requested', async () => {
      const connectivityRequest: ValidationRequestDto = {
        resources: {
          rooms: [],
          upsList: [{ name: 'UPS-01', ip: '192.168.1.100' }],
          servers: [
            {
              name: 'WEB-01',
              state: 'stopped',
              grace_period_on: 30,
              grace_period_off: 30,
              adminUrl: 'https://192.168.1.10',
              ip: '192.168.1.10',
              login: 'admin',
              password: 'password',
              type: 'esxi',
              priority: 1,
              ilo_ip: '192.168.1.11',
              ilo_login: 'admin',
              ilo_password: 'password',
            },
          ],
        },
        checkConnectivity: true,
      };

      jest.spyOn(upsRepository, 'findOneByField').mockResolvedValue(null);
      jest.spyOn(serverRepository, 'findOneByField').mockResolvedValue(null);

      // Mock the private pingHost method
      jest
        .spyOn(useCase as any, 'pingHost')
        .mockResolvedValueOnce(true) // UPS ping
        .mockResolvedValueOnce(false) // Server ping
        .mockResolvedValueOnce(true); // ILO ping

      const result = await useCase.execute(connectivityRequest);

      expect(result.valid).toBe(true);
      expect(result.connectivityResults).toBeDefined();
      expect(result.connectivityResults!.ups).toHaveLength(1);
      expect(result.connectivityResults!.ups[0]).toEqual({
        index: 0,
        ip: '192.168.1.100',
        accessible: true,
      });
      expect(result.connectivityResults!.servers).toHaveLength(1);
      expect(result.connectivityResults!.servers[0]).toEqual({
        index: 0,
        ip: '192.168.1.10',
        accessible: false,
        iloIp: '192.168.1.11',
        iloAccessible: true,
      });
    });
  });
});
