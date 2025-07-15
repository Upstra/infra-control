import { Test, TestingModule } from '@nestjs/testing';
import { PriorityController } from '../priority.controller';
import {
  GetServerPrioritiesUseCase,
  SwapServerPrioritiesUseCase,
} from '../../use-cases';
import {
  ServerPriorityResponseDto,
  SwapServerPriorityDto,
  SwapServerResponseDto,
} from '../../dto';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

describe('PriorityController', () => {
  let controller: PriorityController;
  let getServerPriorities: jest.Mocked<GetServerPrioritiesUseCase>;
  let swapServerPriorities: jest.Mocked<SwapServerPrioritiesUseCase>;

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
          provide: SwapServerPrioritiesUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PriorityController>(PriorityController);
    getServerPriorities = module.get(GetServerPrioritiesUseCase);
    swapServerPriorities = module.get(SwapServerPrioritiesUseCase);
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

      const result = await controller.getServerPrioritiesList(userWithoutId);

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
});
