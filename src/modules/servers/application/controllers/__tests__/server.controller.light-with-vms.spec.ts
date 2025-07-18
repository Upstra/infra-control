import { Test, TestingModule } from '@nestjs/testing';
import { ServerController } from '../server.controller';
import { GetServersWithVmsUseCase } from '../../use-cases/get-servers-with-vms.use-case';
import { ServerWithVmsResponseDto } from '../../dto/server-with-vms.response.dto';

describe('ServerController - light-with-vms endpoint', () => {
  let controller: ServerController;
  let getServersWithVmsUseCase: jest.Mocked<GetServersWithVmsUseCase>;

  const mockServersWithVms: ServerWithVmsResponseDto[] = [
    {
      id: 'server-1',
      name: 'ESXi-Server-01',
      ip: '192.168.1.10',
      hostMoid: 'host-123',
      vms: [
        { id: 'vm-1', name: 'VM-Server1-01', state: 'running' },
        { id: 'vm-2', name: 'VM-Server1-02', state: 'stopped' }
      ]
    },
    {
      id: 'server-2',
      name: 'ESXi-Server-02',
      ip: '192.168.1.20',
      hostMoid: 'host-456',
      vms: [
        { id: 'vm-3', name: 'VM-Server2-01', state: 'running' }
      ]
    }
  ];

  beforeEach(async () => {
    const mockGetServersWithVmsUseCase = {
      execute: jest.fn(),
    };

    // Mock all required dependencies
    const mockUseCases = {
      getAllServersUseCase: { execute: jest.fn() },
      getServerByIdUseCase: { execute: jest.fn() },
      createServerUseCase: { execute: jest.fn() },
      updateServerUseCase: { execute: jest.fn() },
      deleteServerUseCase: { execute: jest.fn() },
      getUserServersUseCase: { execute: jest.fn() },
      updateServerPriorityUseCase: { execute: jest.fn() },
      checkServerPermissionUseCase: { execute: jest.fn() },
      pingServerUseCase: { execute: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServerController],
      providers: [
        {
          provide: GetServersWithVmsUseCase,
          useValue: mockGetServersWithVmsUseCase,
        },
        ...Object.entries(mockUseCases).map(([key, value]) => ({
          provide: key,
          useValue: value,
        })),
      ],
    }).compile();

    controller = module.get<ServerController>(ServerController);
    getServersWithVmsUseCase = module.get(GetServersWithVmsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getServersWithVms', () => {
    it('should return servers with their VMs', async () => {
      // Arrange
      getServersWithVmsUseCase.execute.mockResolvedValue(mockServersWithVms);

      // Act
      const result = await controller.getServersWithVms();

      // Assert
      expect(getServersWithVmsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(getServersWithVmsUseCase.execute).toHaveBeenCalledWith();
      expect(result).toEqual(mockServersWithVms);
    });

    it('should return empty array when no servers exist', async () => {
      // Arrange
      getServersWithVmsUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await controller.getServersWithVms();

      // Assert
      expect(result).toEqual([]);
    });

    it('should return servers with empty VMs arrays', async () => {
      // Arrange
      const serversWithoutVms = [
        {
          id: 'server-1',
          name: 'ESXi-Server-01',
          ip: '192.168.1.10',
          hostMoid: 'host-123',
          vms: []
        }
      ];
      getServersWithVmsUseCase.execute.mockResolvedValue(serversWithoutVms);

      // Act
      const result = await controller.getServersWithVms();

      // Assert
      expect(result).toEqual(serversWithoutVms);
      expect(result[0].vms).toEqual([]);
    });

    it('should propagate use case errors', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      getServersWithVmsUseCase.execute.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.getServersWithVms()).rejects.toThrow(errorMessage);
    });

    it('should handle large number of servers and VMs', async () => {
      // Arrange
      const largeDataSet = Array.from({ length: 100 }, (_, i) => ({
        id: `server-${i}`,
        name: `ESXi-Server-${i.toString().padStart(2, '0')}`,
        ip: `192.168.1.${i + 10}`,
        hostMoid: `host-${i}`,
        vms: Array.from({ length: 10 }, (_, j) => ({
          id: `vm-${i}-${j}`,
          name: `VM-Server${i}-${j.toString().padStart(2, '0')}`,
          state: j % 2 === 0 ? 'running' : 'stopped'
        }))
      }));
      getServersWithVmsUseCase.execute.mockResolvedValue(largeDataSet);

      // Act
      const result = await controller.getServersWithVms();

      // Assert
      expect(result).toHaveLength(100);
      expect(result[0].vms).toHaveLength(10);
    });
  });

  describe('endpoint structure verification', () => {
    it('should return data in expected format', async () => {
      // Arrange
      getServersWithVmsUseCase.execute.mockResolvedValue(mockServersWithVms);

      // Act
      const result = await controller.getServersWithVms();

      // Assert
      expect(result).toHaveLength(2);
      
      // Verify first server structure
      expect(result[0]).toEqual({
        id: expect.any(String),
        name: expect.any(String),
        ip: expect.any(String),
        hostMoid: expect.any(String),
        vms: expect.any(Array)
      });

      // Verify VM structure
      result[0].vms.forEach(vm => {
        expect(vm).toEqual({
          id: expect.any(String),
          name: expect.any(String),
          state: expect.any(String)
        });
      });
    });

    it('should include exactly the expected fields in server response', async () => {
      // Arrange
      getServersWithVmsUseCase.execute.mockResolvedValue(mockServersWithVms);

      // Act
      const result = await controller.getServersWithVms();

      // Assert
      result.forEach(server => {
        const serverKeys = Object.keys(server);
        expect(serverKeys).toEqual(['id', 'name', 'ip', 'hostMoid', 'vms']);
      });
    });

    it('should include exactly the expected fields in VM response', async () => {
      // Arrange
      getServersWithVmsUseCase.execute.mockResolvedValue(mockServersWithVms);

      // Act
      const result = await controller.getServersWithVms();

      // Assert
      result.forEach(server => {
        server.vms.forEach(vm => {
          const vmKeys = Object.keys(vm);
          expect(vmKeys).toEqual(['id', 'name', 'state']);
        });
      });
    });
  });

  describe('performance considerations', () => {
    it('should handle servers with many VMs efficiently', async () => {
      // Arrange
      const serverWithManyVms = {
        id: 'server-1',
        name: 'ESXi-Server-01',
        ip: '192.168.1.10',
        hostMoid: 'host-123',
        vms: Array.from({ length: 1000 }, (_, i) => ({
          id: `vm-${i}`,
          name: `VM-${i}`,
          state: 'running'
        }))
      };
      getServersWithVmsUseCase.execute.mockResolvedValue([serverWithManyVms]);

      // Act
      const startTime = Date.now();
      const result = await controller.getServersWithVms();
      const endTime = Date.now();

      // Assert
      expect(result[0].vms).toHaveLength(1000);
      // Should complete within reasonable time (less than 100ms for processing)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});