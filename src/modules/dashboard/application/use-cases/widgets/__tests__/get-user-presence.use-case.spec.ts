import { GetUserPresenceUseCase } from '../get-user-presence.use-case';
import { PresenceService } from '../../../../../presence/application/services/presence.service';

describe('GetUserPresenceUseCase', () => {
  let useCase: GetUserPresenceUseCase;
  let presenceService: jest.Mocked<PresenceService>;

  beforeEach(() => {
    presenceService = {
      getConnectedUserCount: jest.fn(),
      markOnline: jest.fn(),
      markOffline: jest.fn(),
      isOnline: jest.fn(),
      trackUsers: jest.fn(),
      refreshTTL: jest.fn(),
    } as any;

    useCase = new GetUserPresenceUseCase(presenceService);
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

    it('should return user presence data when no users are online', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(0);

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

      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should return user presence data when one user is online', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(1);

      const result = await useCase.execute();

      expect(result).toEqual({
        onlineUsers: [
          {
            id: 'user-0',
            name: 'User 1',
            avatar: undefined,
            status: 'active',
            location: 'Dashboard',
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

      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should return user presence data when multiple users are online', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(3);

      const result = await useCase.execute();

      expect(result).toEqual({
        onlineUsers: [
          {
            id: 'user-0',
            name: 'User 1',
            avatar: undefined,
            status: 'active',
            location: 'Dashboard',
            lastSeen: mockDate,
          },
          {
            id: 'user-1',
            name: 'User 2',
            avatar: undefined,
            status: 'active',
            location: 'Dashboard',
            lastSeen: mockDate,
          },
          {
            id: 'user-2',
            name: 'User 3',
            avatar: undefined,
            status: 'active',
            location: 'Dashboard',
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

      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should limit online users to maximum of 5', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(10);

      const result = await useCase.execute();

      expect(result.onlineUsers).toHaveLength(5);
      expect(result.onlineUsers).toEqual([
        {
          id: 'user-0',
          name: 'User 1',
          avatar: undefined,
          status: 'active',
          location: 'Dashboard',
          lastSeen: mockDate,
        },
        {
          id: 'user-1',
          name: 'User 2',
          avatar: undefined,
          status: 'active',
          location: 'Dashboard',
          lastSeen: mockDate,
        },
        {
          id: 'user-2',
          name: 'User 3',
          avatar: undefined,
          status: 'active',
          location: 'Dashboard',
          lastSeen: mockDate,
        },
        {
          id: 'user-3',
          name: 'User 4',
          avatar: undefined,
          status: 'active',
          location: 'Dashboard',
          lastSeen: mockDate,
        },
        {
          id: 'user-4',
          name: 'User 5',
          avatar: undefined,
          status: 'active',
          location: 'Dashboard',
          lastSeen: mockDate,
        },
      ]);

      expect(result.summary.online).toBe(5);
      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should handle exactly 5 users online', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(5);

      const result = await useCase.execute();

      expect(result.onlineUsers).toHaveLength(5);
      expect(result.summary.online).toBe(5);
      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should handle presence service failure', async () => {
      presenceService.getConnectedUserCount.mockRejectedValue(
        new Error('Service unavailable'),
      );

      await expect(useCase.execute()).rejects.toThrow('Service unavailable');

      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should handle negative user count from service', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(-1);

      const result = await useCase.execute();

      expect(result.onlineUsers).toEqual([]);
      expect(result.summary.online).toBe(0);
      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should handle zero user count from service', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(0);

      const result = await useCase.execute();

      expect(result.onlineUsers).toEqual([]);
      expect(result.summary.online).toBe(0);
      expect(result.summary.idle).toBe(0);
      expect(result.summary.offline).toBe(0);
      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should always return empty recentlyOffline array', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(2);

      const result = await useCase.execute();

      expect(result.recentlyOffline).toEqual([]);
      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should always return idle and offline counts as 0', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(7);

      const result = await useCase.execute();

      expect(result.summary.idle).toBe(0);
      expect(result.summary.offline).toBe(0);
      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should generate correct user IDs and names', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(3);

      const result = await useCase.execute();

      expect(result.onlineUsers[0]).toEqual({
        id: 'user-0',
        name: 'User 1',
        avatar: undefined,
        status: 'active',
        location: 'Dashboard',
        lastSeen: mockDate,
      });

      expect(result.onlineUsers[1]).toEqual({
        id: 'user-1',
        name: 'User 2',
        avatar: undefined,
        status: 'active',
        location: 'Dashboard',
        lastSeen: mockDate,
      });

      expect(result.onlineUsers[2]).toEqual({
        id: 'user-2',
        name: 'User 3',
        avatar: undefined,
        status: 'active',
        location: 'Dashboard',
        lastSeen: mockDate,
      });

      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should handle large user count efficiently', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(1000);

      const result = await useCase.execute();

      expect(result.onlineUsers).toHaveLength(5);
      expect(result.summary.online).toBe(5);
      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should ensure all online users have active status', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(4);

      const result = await useCase.execute();

      result.onlineUsers.forEach((user) => {
        expect(user.status).toBe('active');
      });

      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should ensure all online users have Dashboard location', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(4);

      const result = await useCase.execute();

      result.onlineUsers.forEach((user) => {
        expect(user.location).toBe('Dashboard');
      });

      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should ensure all online users have undefined avatar', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(4);

      const result = await useCase.execute();

      result.onlineUsers.forEach((user) => {
        expect(user.avatar).toBeUndefined();
      });

      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should ensure all online users have same lastSeen time', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(4);

      const result = await useCase.execute();

      result.onlineUsers.forEach((user) => {
        expect(user.lastSeen).toEqual(mockDate);
      });

      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should handle Math.min edge case with exactly 5 users', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(5);

      const result = await useCase.execute();

      expect(result.onlineUsers).toHaveLength(5);
      expect(result.onlineUsers[4]).toEqual({
        id: 'user-4',
        name: 'User 5',
        avatar: undefined,
        status: 'active',
        location: 'Dashboard',
        lastSeen: mockDate,
      });

      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should handle Math.min edge case with 1 user', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(1);

      const result = await useCase.execute();

      expect(result.onlineUsers).toHaveLength(1);
      expect(result.onlineUsers[0]).toEqual({
        id: 'user-0',
        name: 'User 1',
        avatar: undefined,
        status: 'active',
        location: 'Dashboard',
        lastSeen: mockDate,
      });

      expect(presenceService.getConnectedUserCount).toHaveBeenCalled();
    });

    it('should handle concurrent execution', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(2);

      const results = await Promise.all([
        useCase.execute(),
        useCase.execute(),
        useCase.execute(),
      ]);

      results.forEach((result) => {
        expect(result.onlineUsers).toHaveLength(2);
        expect(result.summary.online).toBe(2);
      });

      expect(presenceService.getConnectedUserCount).toHaveBeenCalledTimes(3);
    });

    it('should maintain consistent structure across calls', async () => {
      presenceService.getConnectedUserCount.mockResolvedValue(3);

      const result1 = await useCase.execute();
      const result2 = await useCase.execute();

      expect(result1).toEqual(result2);
      expect(presenceService.getConnectedUserCount).toHaveBeenCalledTimes(2);
    });
  });
});
