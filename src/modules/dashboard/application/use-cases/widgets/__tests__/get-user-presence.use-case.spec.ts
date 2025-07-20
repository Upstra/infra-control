import { Test, TestingModule } from '@nestjs/testing';
import { GetUserPresenceUseCase } from '../get-user-presence.use-case';
import { PresenceService } from '../../../../../presence/application/services/presence.service';
import { UserRepositoryInterface } from '../../../../../users/domain/interfaces/user.repository.interface';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';

describe('GetUserPresenceUseCase', () => {
  let useCase: GetUserPresenceUseCase;
  let presenceService: jest.Mocked<PresenceService>;
  let userRepository: jest.Mocked<UserRepositoryInterface>;
  let redisSafeService: jest.Mocked<RedisSafeService>;

  const mockUsers = [
    {
      id: 'user-1',
      username: 'john.doe',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
    {
      id: 'user-2',
      username: 'jane.smith',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
    },
    {
      id: 'user-3',
      username: 'admin',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
    },
  ];

  beforeEach(async () => {
    const mockPresenceService = {
      getConnectedUserCount: jest.fn(),
      markOnline: jest.fn(),
      markOffline: jest.fn(),
      isOnline: jest.fn(),
      trackUsers: jest.fn(),
      refreshTTL: jest.fn(),
    };

    const mockUserRepository = {
      findByIds: jest.fn(),
    };

    const mockRedisSafeService = {
      keys: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserPresenceUseCase,
        {
          provide: PresenceService,
          useValue: mockPresenceService,
        },
        {
          provide: 'UserRepositoryInterface',
          useValue: mockUserRepository,
        },
        {
          provide: RedisSafeService,
          useValue: mockRedisSafeService,
        },
      ],
    }).compile();

    useCase = module.get<GetUserPresenceUseCase>(GetUserPresenceUseCase);
    presenceService = module.get(PresenceService);
    userRepository = module.get('UserRepositoryInterface');
    redisSafeService = module.get(RedisSafeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockDate = new Date('2024-01-01T00:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return empty data when no users are online', async () => {
      redisSafeService.keys.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result).toEqual({
        onlineUsers: [],
        recentlyOffline: [],
        summary: {
          online: 0,
          idle: 0,
          offline: 0,
        },
      });

      expect(redisSafeService.keys).toHaveBeenCalledWith('presence:*');
      expect(userRepository.findByIds).not.toHaveBeenCalled();
    });

    it('should return user presence data when one user is online', async () => {
      redisSafeService.keys.mockResolvedValue(['presence:user-1']);
      userRepository.findByIds.mockResolvedValue([mockUsers[0]] as any);

      const result = await useCase.execute();

      expect(result).toEqual({
        onlineUsers: [
          {
            id: 'user-1',
            name: 'john.doe',
            avatar: undefined,
            status: 'active',
            location: 'Unknown',
            lastSeen: mockDate,
          },
        ],
        recentlyOffline: [],
        summary: {
          online: 1,
          idle: 0,
          offline: 0,
        },
      });

      expect(redisSafeService.keys).toHaveBeenCalledWith('presence:*');
      expect(userRepository.findByIds).toHaveBeenCalledWith(['user-1']);
    });

    it('should return user presence data when multiple users are online', async () => {
      redisSafeService.keys.mockResolvedValue([
        'presence:user-1',
        'presence:user-2',
        'presence:user-3',
      ]);
      userRepository.findByIds.mockResolvedValue(mockUsers as any);

      const result = await useCase.execute();

      expect(result).toEqual({
        onlineUsers: [
          {
            id: 'user-1',
            name: 'john.doe',
            avatar: undefined,
            status: 'active',
            location: 'Unknown',
            lastSeen: mockDate,
          },
          {
            id: 'user-2',
            name: 'jane.smith',
            avatar: undefined,
            status: 'active',
            location: 'Unknown',
            lastSeen: mockDate,
          },
          {
            id: 'user-3',
            name: 'admin',
            avatar: undefined,
            status: 'active',
            location: 'Unknown',
            lastSeen: mockDate,
          },
        ],
        recentlyOffline: [],
        summary: {
          online: 3,
          idle: 0,
          offline: 0,
        },
      });

      expect(redisSafeService.keys).toHaveBeenCalledWith('presence:*');
      expect(userRepository.findByIds).toHaveBeenCalledWith(['user-1', 'user-2', 'user-3']);
    });

    it('should handle null keys from Redis', async () => {
      redisSafeService.keys.mockResolvedValue(null as any);

      const result = await useCase.execute();

      expect(result).toEqual({
        onlineUsers: [],
        recentlyOffline: [],
        summary: {
          online: 0,
          idle: 0,
          offline: 0,
        },
      });

      expect(redisSafeService.keys).toHaveBeenCalledWith('presence:*');
      expect(userRepository.findByIds).not.toHaveBeenCalled();
    });

    it('should handle users not found in repository', async () => {
      redisSafeService.keys.mockResolvedValue([
        'presence:user-1',
        'presence:user-2',
        'presence:user-3',
      ]);
      userRepository.findByIds.mockResolvedValue([mockUsers[0]] as any);

      const result = await useCase.execute();

      expect(result.onlineUsers).toHaveLength(1);
      expect(result.summary.online).toBe(1);
      expect(userRepository.findByIds).toHaveBeenCalledWith(['user-1', 'user-2', 'user-3']);
    });

    it('should handle Redis service failure', async () => {
      redisSafeService.keys.mockRejectedValue(new Error('Redis unavailable'));

      await expect(useCase.execute()).rejects.toThrow('Redis unavailable');

      expect(redisSafeService.keys).toHaveBeenCalledWith('presence:*');
    });

    it('should handle user repository failure', async () => {
      redisSafeService.keys.mockResolvedValue(['presence:user-1']);
      userRepository.findByIds.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute()).rejects.toThrow('Database error');

      expect(redisSafeService.keys).toHaveBeenCalledWith('presence:*');
      expect(userRepository.findByIds).toHaveBeenCalledWith(['user-1']);
    });

    it('should always return empty recentlyOffline array', async () => {
      redisSafeService.keys.mockResolvedValue(['presence:user-1']);
      userRepository.findByIds.mockResolvedValue([mockUsers[0]] as any);

      const result = await useCase.execute();

      expect(result.recentlyOffline).toEqual([]);
    });

    it('should always return idle and offline counts as 0', async () => {
      redisSafeService.keys.mockResolvedValue(['presence:user-1', 'presence:user-2']);
      userRepository.findByIds.mockResolvedValue([mockUsers[0], mockUsers[1]] as any);

      const result = await useCase.execute();

      expect(result.summary.idle).toBe(0);
      expect(result.summary.offline).toBe(0);
    });

    it('should extract user IDs correctly from presence keys', async () => {
      redisSafeService.keys.mockResolvedValue([
        'presence:user-123',
        'presence:user-456',
        'presence:user-789',
      ]);
      userRepository.findByIds.mockResolvedValue([]);

      await useCase.execute();

      expect(userRepository.findByIds).toHaveBeenCalledWith(['user-123', 'user-456', 'user-789']);
    });

    it('should ensure all online users have active status', async () => {
      redisSafeService.keys.mockResolvedValue([
        'presence:user-1',
        'presence:user-2',
      ]);
      userRepository.findByIds.mockResolvedValue([mockUsers[0], mockUsers[1]] as any);

      const result = await useCase.execute();

      result.onlineUsers.forEach((user) => {
        expect(user.status).toBe('active');
      });
    });

    it('should ensure all online users have Unknown location', async () => {
      redisSafeService.keys.mockResolvedValue([
        'presence:user-1',
        'presence:user-2',
      ]);
      userRepository.findByIds.mockResolvedValue([mockUsers[0], mockUsers[1]] as any);

      const result = await useCase.execute();

      result.onlineUsers.forEach((user) => {
        expect(user.location).toBe('Unknown');
      });
    });

    it('should ensure all online users have undefined avatar', async () => {
      redisSafeService.keys.mockResolvedValue([
        'presence:user-1',
        'presence:user-2',
      ]);
      userRepository.findByIds.mockResolvedValue([mockUsers[0], mockUsers[1]] as any);

      const result = await useCase.execute();

      result.onlineUsers.forEach((user) => {
        expect(user.avatar).toBeUndefined();
      });
    });

    it('should ensure all online users have same lastSeen time', async () => {
      redisSafeService.keys.mockResolvedValue([
        'presence:user-1',
        'presence:user-2',
      ]);
      userRepository.findByIds.mockResolvedValue([mockUsers[0], mockUsers[1]] as any);

      const result = await useCase.execute();

      result.onlineUsers.forEach((user) => {
        expect(user.lastSeen).toEqual(mockDate);
      });
    });

    it('should handle concurrent execution', async () => {
      redisSafeService.keys.mockResolvedValue(['presence:user-1']);
      userRepository.findByIds.mockResolvedValue([mockUsers[0]] as any);

      const results = await Promise.all([
        useCase.execute(),
        useCase.execute(),
        useCase.execute(),
      ]);

      results.forEach((result) => {
        expect(result.onlineUsers).toHaveLength(1);
        expect(result.summary.online).toBe(1);
      });

      expect(redisSafeService.keys).toHaveBeenCalledTimes(3);
      expect(userRepository.findByIds).toHaveBeenCalledTimes(3);
    });

    it('should maintain consistent structure across calls', async () => {
      redisSafeService.keys.mockResolvedValue(['presence:user-1', 'presence:user-2']);
      userRepository.findByIds.mockResolvedValue([mockUsers[0], mockUsers[1]] as any);

      const result1 = await useCase.execute();
      const result2 = await useCase.execute();

      expect(result1).toEqual(result2);
      expect(redisSafeService.keys).toHaveBeenCalledTimes(2);
      expect(userRepository.findByIds).toHaveBeenCalledTimes(2);
    });

    it('should handle large number of online users', async () => {
      const manyKeys = Array.from({ length: 100 }, (_, i) => `presence:user-${i}`);
      const manyUsers = Array.from({ length: 100 }, (_, i) => ({
        id: `user-${i}`,
        username: `user${i}`,
      }));

      redisSafeService.keys.mockResolvedValue(manyKeys);
      userRepository.findByIds.mockResolvedValue(manyUsers as any);

      const result = await useCase.execute();

      expect(result.onlineUsers).toHaveLength(100);
      expect(result.summary.online).toBe(100);
      expect(userRepository.findByIds).toHaveBeenCalledWith(
        manyKeys.map(key => key.replace('presence:', ''))
      );
    });

    it('should handle empty user data from repository', async () => {
      redisSafeService.keys.mockResolvedValue(['presence:user-1']);
      userRepository.findByIds.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result.onlineUsers).toEqual([]);
      expect(result.summary.online).toBe(0);
    });

    it('should use username as the name field', async () => {
      redisSafeService.keys.mockResolvedValue(['presence:user-1']);
      userRepository.findByIds.mockResolvedValue([
        {
          id: 'user-1',
          username: 'custom.username',
          email: 'test@example.com',
          firstName: 'First',
          lastName: 'Last',
        }
      ] as any);

      const result = await useCase.execute();

      expect(result.onlineUsers[0].name).toBe('custom.username');
    });
  });
});