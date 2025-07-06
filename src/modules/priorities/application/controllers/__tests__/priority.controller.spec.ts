import { Test, TestingModule } from '@nestjs/testing';
import { PriorityController } from '../priority.controller';
import {
  GetServerPrioritiesUseCase,
  GetVmPrioritiesUseCase,
  SwapServerPrioritiesUseCase,
  SwapVmPrioritiesUseCase,
} from '../../use-cases';
import {
  ServerPriorityResponseDto,
  VmPriorityResponseDto,
  SwapServerPriorityDto,
  SwapVmPriorityDto,
  SwapServerResponseDto,
  SwapVmResponseDto,
} from '../../dto';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

describe('PriorityController', () => {
  let controller: PriorityController;
  let getServerPriorities: jest.Mocked<GetServerPrioritiesUseCase>;
  let getVmPriorities: jest.Mocked<GetVmPrioritiesUseCase>;
  let swapServerPriorities: jest.Mocked<SwapServerPrioritiesUseCase>;
  let swapVmPriorities: jest.Mocked<SwapVmPrioritiesUseCase>;

  const mockUserId = 'user-123';
  const mockUser: JwtPayload = {
    userId: mockUserId,
    email: 'test@example.com',
  };

  const mockServerPriorities: ServerPriorityResponseDto[] = [
    {
      id: 'server-1',
      name: 'Server 1',
      priority: 1,
      ipAddress: '192.168.1.1',
      state: 'running',
    },
    {
      id: 'server-2',
      name: 'Server 2',
      priority: 2,
      ipAddress: '192.168.1.2',
      state: 'stopped',
    },
  ];

  const mockVmPriorities: VmPriorityResponseDto[] = [
    {
      id: 'vm-1',
      name: 'VM 1',
      serverId: 'server-1',
      priority: 1,
      state: 'running',
    },
    {
      id: 'vm-2',
      name: 'VM 2',
      serverId: 'server-1',
      priority: 2,
      state: 'stopped',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PriorityController],
      providers: [
        {
          provide: GetServerPrioritiesUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetVmPrioritiesUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: SwapServerPrioritiesUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: SwapVmPrioritiesUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PriorityController>(PriorityController);
    getServerPriorities = module.get(GetServerPrioritiesUseCase);
    getVmPriorities = module.get(GetVmPrioritiesUseCase);
    swapServerPriorities = module.get(SwapServerPrioritiesUseCase);
    swapVmPriorities = module.get(SwapVmPrioritiesUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getServerPrioritiesList', () => {
    it('should return server priorities list', async () => {
      getServerPriorities.execute.mockResolvedValue(mockServerPriorities);

      const result = await controller.getServerPrioritiesList(mockUser);

      expect(getServerPriorities.execute).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockServerPriorities);
    });

    it('should handle request with no user', async () => {
      const userWithoutId: JwtPayload = {
        userId: undefined as any,
        email: 'test@example.com',
      };

      getServerPriorities.execute.mockResolvedValue([]);

      const result =
        await controller.getServerPrioritiesList(userWithoutId);

      expect(getServerPriorities.execute).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([]);
    });

    it('should handle empty server list', async () => {
      getServerPriorities.execute.mockResolvedValue([]);

      const result = await controller.getServerPrioritiesList(mockUser);

      expect(result).toEqual([]);
    });

    it('should propagate errors from use case', async () => {
      const error = new Error('Database error');
      getServerPriorities.execute.mockRejectedValue(error);

      await expect(
        controller.getServerPrioritiesList(mockUser),
      ).rejects.toThrow(error);
    });
  });

  describe('getVmPrioritiesList', () => {
    it('should return VM priorities list', async () => {
      getVmPriorities.execute.mockResolvedValue(mockVmPriorities);

      const result = await controller.getVmPrioritiesList(mockUser);

      expect(getVmPriorities.execute).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockVmPriorities);
    });

    it('should handle request with no user', async () => {
      const userWithoutId: JwtPayload = {
        userId: undefined as any,
        email: 'test@example.com',
      };

      getVmPriorities.execute.mockResolvedValue([]);

      const result = await controller.getVmPrioritiesList(userWithoutId);

      expect(getVmPriorities.execute).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([]);
    });

    it('should handle empty VM list', async () => {
      getVmPriorities.execute.mockResolvedValue([]);

      const result = await controller.getVmPrioritiesList(mockUser);

      expect(result).toEqual([]);
    });

    it('should propagate errors from use case', async () => {
      const error = new Error('Database error');
      getVmPriorities.execute.mockRejectedValue(error);

      await expect(controller.getVmPrioritiesList(mockUser)).rejects.toThrow(
        error,
      );
    });
  });

  describe('swapServerPrioritiesHandler', () => {
    const swapDto: SwapServerPriorityDto = {
      server1Id: 'server-1',
      server2Id: 'server-2',
    };

    const mockSwapResponse: SwapServerResponseDto = {
      server1: { id: 'server-1', priority: 2 },
      server2: { id: 'server-2', priority: 1 },
    };

    it('should swap server priorities successfully', async () => {
      swapServerPriorities.execute.mockResolvedValue(mockSwapResponse);

      const result = await controller.swapServerPrioritiesHandler(
        swapDto,
        mockUser,
      );

      expect(swapServerPriorities.execute).toHaveBeenCalledWith(
        swapDto.server1Id,
        swapDto.server2Id,
        mockUserId,
      );
      expect(result).toEqual(mockSwapResponse);
    });

    it('should handle request with no user', async () => {
      const userWithoutId: JwtPayload = {
        userId: undefined as any,
        email: 'test@example.com',
      };

      swapServerPriorities.execute.mockResolvedValue(mockSwapResponse);

      const result = await controller.swapServerPrioritiesHandler(
        swapDto,
        userWithoutId,
      );

      expect(swapServerPriorities.execute).toHaveBeenCalledWith(
        swapDto.server1Id,
        swapDto.server2Id,
        undefined,
      );
      expect(result).toEqual(mockSwapResponse);
    });

    it('should propagate ForbiddenException from use case', async () => {
      const error = new Error('Forbidden');
      swapServerPriorities.execute.mockRejectedValue(error);

      await expect(
        controller.swapServerPrioritiesHandler(swapDto, mockUser),
      ).rejects.toThrow(error);
    });

    it('should propagate NotFoundException from use case', async () => {
      const error = new Error('Not Found');
      swapServerPriorities.execute.mockRejectedValue(error);

      await expect(
        controller.swapServerPrioritiesHandler(swapDto, mockUser),
      ).rejects.toThrow(error);
    });
  });

  describe('swapVmPrioritiesHandler', () => {
    const swapDto: SwapVmPriorityDto = {
      vm1Id: 'vm-1',
      vm2Id: 'vm-2',
    };

    const mockSwapResponse: SwapVmResponseDto = {
      vm1: { id: 'vm-1', priority: 2 },
      vm2: { id: 'vm-2', priority: 1 },
    };

    it('should swap VM priorities successfully', async () => {
      swapVmPriorities.execute.mockResolvedValue(mockSwapResponse);

      const result = await controller.swapVmPrioritiesHandler(
        swapDto,
        mockUser,
      );

      expect(swapVmPriorities.execute).toHaveBeenCalledWith(
        swapDto.vm1Id,
        swapDto.vm2Id,
        mockUserId,
      );
      expect(result).toEqual(mockSwapResponse);
    });

    it('should handle request with no user', async () => {
      const userWithoutId: JwtPayload = {
        userId: undefined as any,
        email: 'test@example.com',
      };

      swapVmPriorities.execute.mockResolvedValue(mockSwapResponse);

      const result = await controller.swapVmPrioritiesHandler(
        swapDto,
        userWithoutId,
      );

      expect(swapVmPriorities.execute).toHaveBeenCalledWith(
        swapDto.vm1Id,
        swapDto.vm2Id,
        undefined,
      );
      expect(result).toEqual(mockSwapResponse);
    });

    it('should propagate ForbiddenException from use case', async () => {
      const error = new Error('Forbidden');
      swapVmPriorities.execute.mockRejectedValue(error);

      await expect(
        controller.swapVmPrioritiesHandler(swapDto, mockUser),
      ).rejects.toThrow(error);
    });

    it('should propagate NotFoundException from use case', async () => {
      const error = new Error('Not Found');
      swapVmPriorities.execute.mockRejectedValue(error);

      await expect(
        controller.swapVmPrioritiesHandler(swapDto, mockUser),
      ).rejects.toThrow(error);
    });
  });
});
