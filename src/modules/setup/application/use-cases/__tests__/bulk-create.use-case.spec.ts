import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, QueryRunner } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { BulkCreateUseCase } from '../bulk-create.use-case';
import { CompleteSetupStepUseCase } from '../complete-setup-step.use-case';
import { BulkCreateRequestDto, SetupStep } from '../../dto';
import { Room } from '../../../../rooms/domain/entities/room.entity';
import { Ups } from '../../../../ups/domain/entities/ups.entity';
import { Server } from '../../../../servers/domain/entities/server.entity';
import { Ilo } from '../../../../ilos/domain/entities/ilo.entity';

describe('BulkCreateUseCase', () => {
  let useCase: BulkCreateUseCase;
  let completeSetupStepUseCase: CompleteSetupStepUseCase;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkCreateUseCase,
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
          },
        },
        {
          provide: 'RoomRepositoryInterface',
          useValue: {
            save: jest.fn(),
            findOneByField: jest.fn(),
          },
        },
        {
          provide: 'UpsRepositoryInterface',
          useValue: {
            save: jest.fn(),
            findOneByField: jest.fn(),
          },
        },
        {
          provide: 'ServerRepositoryInterface',
          useValue: {
            save: jest.fn(),
            findServerById: jest.fn(),
          },
        },
        {
          provide: CompleteSetupStepUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<BulkCreateUseCase>(BulkCreateUseCase);
    completeSetupStepUseCase = module.get<CompleteSetupStepUseCase>(
      CompleteSetupStepUseCase,
    );
  });

  describe('execute', () => {
    const validRequest: BulkCreateRequestDto = {
      rooms: [
        { name: 'Room 1', tempId: 'temp_room_1' },
        { name: 'Room 2', tempId: 'temp_room_2' },
      ],
      upsList: [
        {
          name: 'UPS-01',
          ip: '192.168.1.100',
          roomId: 'temp_room_1',
          tempId: 'temp_ups_1',
        },
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
          upsId: 'temp_ups_1',
        },
      ],
    };

    it('should successfully create all resources', async () => {
      const mockRoom1 = { id: 'room-uuid-1', name: 'Room 1' } as Room;
      const mockRoom2 = { id: 'room-uuid-2', name: 'Room 2' } as Room;
      const mockUps = { id: 'ups-uuid-1', name: 'UPS-01' } as Ups;
      const mockServer = { id: 'server-uuid-1', name: 'WEB-01' } as Server;

      queryRunner.manager.save = jest
        .fn()
        .mockResolvedValueOnce(mockRoom1)
        .mockResolvedValueOnce(mockRoom2)
        .mockResolvedValueOnce(mockUps)
        .mockResolvedValueOnce(mockServer);

      const result = await useCase.execute(validRequest);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();

      expect(result.success).toBe(true);
      expect(result.created.rooms).toHaveLength(2);
      expect(result.created.upsList).toHaveLength(1);
      expect(result.created.servers).toHaveLength(1);

      expect(result.idMapping.rooms['temp_room_1']).toBe('room-uuid-1');
      expect(result.idMapping.rooms['temp_room_2']).toBe('room-uuid-2');
      expect(result.idMapping.ups['temp_ups_1']).toBe('ups-uuid-1');

      expect(completeSetupStepUseCase.execute).toHaveBeenCalledWith(
        SetupStep.REVIEW,
        undefined,
      );
    });

    it('should create server with ILO', async () => {
      const requestWithIlo: BulkCreateRequestDto = {
        rooms: [{ name: 'Room 1', tempId: 'temp_room_1' }],
        upsList: [],
        servers: [
          {
            ...validRequest.servers[0],
            upsId: undefined, // No UPS reference
            ilo_name: 'ILO-WEB-01',
            ilo_ip: '192.168.1.11',
            ilo_login: 'admin',
            ilo_password: 'password',
          },
        ],
      };

      const mockRoom = { id: 'room-uuid-1', name: 'Room 1' } as Room;
      const mockIlo = { id: 'ilo-uuid-1', name: 'ILO-WEB-01' } as Ilo;
      const mockServer = {
        id: 'server-uuid-1',
        name: 'WEB-01',
        ilo: mockIlo,
      } as Server;

      queryRunner.manager.save = jest
        .fn()
        .mockResolvedValueOnce(mockRoom)
        .mockResolvedValueOnce(mockIlo)
        .mockResolvedValueOnce(mockServer);

      const result = await useCase.execute(requestWithIlo);

      expect(result.success).toBe(true);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Ilo,
        expect.any(Ilo),
      );
    });

    it('should rollback transaction on error', async () => {
      queryRunner.manager.save = jest
        .fn()
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(useCase.execute(validRequest)).rejects.toThrow(
        BadRequestException,
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(completeSetupStepUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw error if UPS missing required IP', async () => {
      const invalidRequest: BulkCreateRequestDto = {
        rooms: [{ name: 'Room 1' }],
        upsList: [{ name: 'UPS-01', roomId: 'room-uuid-1' }],
        servers: [],
      };

      const mockRoom = { id: 'room-uuid-1', name: 'Room 1' } as Room;
      queryRunner.manager.save = jest.fn().mockResolvedValueOnce(mockRoom);

      await expect(useCase.execute(invalidRequest)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(invalidRequest)).rejects.toThrow(
        'IP address is required for UPS UPS-01',
      );
    });

    it('should throw error if server missing room ID', async () => {
      const invalidRequest: BulkCreateRequestDto = {
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
          },
        ],
      };

      await expect(useCase.execute(invalidRequest)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(invalidRequest)).rejects.toThrow(
        'Room ID is required for server WEB-01',
      );
    });

    it('should handle empty resource arrays', async () => {
      const emptyRequest: BulkCreateRequestDto = {
        rooms: [],
        upsList: [],
        servers: [],
      };

      const result = await useCase.execute(emptyRequest);

      expect(result.success).toBe(true);
      expect(result.created.rooms).toHaveLength(0);
      expect(result.created.upsList).toHaveLength(0);
      expect(result.created.servers).toHaveLength(0);
    });

    it('should correctly resolve temporary IDs', async () => {
      const mockRoom = { id: 'room-uuid-1', name: 'Room 1' } as Room;
      const mockUps = { id: 'ups-uuid-1', name: 'UPS-01' } as Ups;
      const mockServer = { id: 'server-uuid-1', name: 'WEB-01' } as Server;

      queryRunner.manager.save = jest
        .fn()
        .mockResolvedValueOnce(mockRoom)
        .mockResolvedValueOnce(mockUps)
        .mockResolvedValueOnce(mockServer);

      await useCase.execute(validRequest);

      // Verify that UPS was created with resolved room ID
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Ups,
        expect.objectContaining({
          roomId: 'room-uuid-1',
        }),
      );

      // Verify that server was created with resolved IDs
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Server,
        expect.objectContaining({
          roomId: 'room-uuid-1',
          upsId: 'ups-uuid-1',
        }),
      );
    });

    it('should handle frontend payload with id fields instead of tempId', async () => {
      const mockRoom = { id: 'room-uuid-1', name: 'Main Room' };
      const mockUps = { id: 'ups-uuid-1', name: 'UPS-Second' };
      const mockServer = { id: 'server-uuid-1', name: 'ESXSRV11' };

      const frontendRequest = {
        rooms: [{
          name: "Main Room",
          id: "temp_1752408362050_0"  // Frontend uses id instead of tempId
        }],
        upsList: [{
          name: "UPS-Second",
          roomId: "temp_1752408362050_0",
          ip: "192.168.1.102",
          id: "temp_1752408362050_1"  // Frontend uses id instead of tempId
        }],
        servers: [{
          name: "ESXSRV11",
          state: "active",
          grace_period_on: 30,
          grace_period_off: 30,
          adminUrl: "https://192.168.1.10",
          ip: "172.23.10.11",
          login: "admin",
          password: "sdf99GHJ",
          type: "esxi",
          priority: 1,
          roomId: "temp_1752408362050_0",
          upsId: "temp_1752408362050_1",
          id: "temp_1752408362050_3"  // Frontend uses id instead of tempId
        }]
      };

      queryRunner.manager.save = jest
        .fn()
        .mockResolvedValueOnce(mockRoom)
        .mockResolvedValueOnce(mockUps)
        .mockResolvedValueOnce(mockServer);

      const result = await useCase.execute(frontendRequest);

      expect(result.success).toBe(true);
      expect(result.created.rooms).toHaveLength(1);
      expect(result.created.upsList).toHaveLength(1);
      expect(result.created.servers).toHaveLength(1);

      // Verify that the frontend id fields are used as tempId in the response
      expect(result.created.rooms[0].tempId).toBe('temp_1752408362050_0');
      expect(result.created.upsList[0].tempId).toBe('temp_1752408362050_1');
      expect(result.created.servers[0].tempId).toBe('temp_1752408362050_3');

      // Verify ID mapping uses frontend id fields
      expect(result.idMapping.rooms['temp_1752408362050_0']).toBe('room-uuid-1');
      expect(result.idMapping.ups['temp_1752408362050_1']).toBe('ups-uuid-1');
    });
  });
});
