import { Test, TestingModule } from '@nestjs/testing';
import { DiscoverySessionService } from '../discovery-session.service';
import { RedisSafeService } from '../../../../redis/application/services/redis-safe.service';
import { DiscoveryStatus } from '../../../application/dto';
import { DiscoverySessionData } from '../../interfaces/discovery-session.interface';
import { Logger } from '@nestjs/common';

describe('DiscoverySessionService', () => {
  let service: DiscoverySessionService;
  let redisSafeService: jest.Mocked<RedisSafeService>;
  let loggerSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;

  const mockSessionData: DiscoverySessionData = {
    sessionId: 'session-123',
    status: DiscoveryStatus.STARTING,
    totalServers: 2,
    serversProcessed: 0,
    successfulServers: 0,
    failedServers: 0,
    totalVmsDiscovered: 0,
    serverResults: [],
    failedServerIds: [],
    progress: 0,
    startedAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T10:00:00Z'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T10:00:00Z'));

    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoverySessionService,
        {
          provide: RedisSafeService,
          useValue: {
            safeSetEx: jest.fn(),
            safeGet: jest.fn(),
            safeDel: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DiscoverySessionService>(DiscoverySessionService);
    redisSafeService = module.get(RedisSafeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    loggerSpy.mockRestore();
    loggerWarnSpy.mockRestore();
  });

  describe('createSession', () => {
    it('should create a new discovery session', async () => {
      const sessionId = 'session-123';
      const totalServers = 2;

      await service.createSession(sessionId, totalServers);

      expect(redisSafeService.safeSetEx).toHaveBeenCalledWith(
        'discovery:session:session-123',
        3600,
        JSON.stringify({
          sessionId,
          status: DiscoveryStatus.STARTING,
          totalServers,
          serversProcessed: 0,
          successfulServers: 0,
          failedServers: 0,
          totalVmsDiscovered: 0,
          serverResults: [],
          failedServerIds: [],
          progress: 0,
          startedAt: new Date('2023-01-01T10:00:00Z'),
          updatedAt: new Date('2023-01-01T10:00:00Z'),
        }),
      );

      expect(redisSafeService.safeSetEx).toHaveBeenCalledWith(
        'discovery:active',
        3600,
        sessionId,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        'Created discovery session: session-123',
      );
    });
  });

  describe('getSession', () => {
    it('should retrieve an existing session', async () => {
      redisSafeService.safeGet.mockResolvedValue(
        JSON.stringify(mockSessionData),
      );

      const result = await service.getSession('session-123');

      expect(redisSafeService.safeGet).toHaveBeenCalledWith(
        'discovery:session:session-123',
      );
      expect(result).toEqual({
        ...mockSessionData,
        startedAt: '2023-01-01T10:00:00.000Z',
        updatedAt: '2023-01-01T10:00:00.000Z',
      });
    });

    it('should return null if session does not exist', async () => {
      redisSafeService.safeGet.mockResolvedValue(null);

      const result = await service.getSession('session-123');

      expect(result).toBeNull();
    });
  });

  describe('getActiveSession', () => {
    it('should retrieve the active session', async () => {
      redisSafeService.safeGet
        .mockResolvedValueOnce('session-123')
        .mockResolvedValueOnce(JSON.stringify(mockSessionData));

      const result = await service.getActiveSession();

      expect(redisSafeService.safeGet).toHaveBeenCalledWith('discovery:active');
      expect(redisSafeService.safeGet).toHaveBeenCalledWith(
        'discovery:session:session-123',
      );
      expect(result).toEqual({
        ...mockSessionData,
        startedAt: '2023-01-01T10:00:00.000Z',
        updatedAt: '2023-01-01T10:00:00.000Z',
      });
    });

    it('should return null if no active session exists', async () => {
      redisSafeService.safeGet.mockResolvedValue(null);

      const result = await service.getActiveSession();

      expect(result).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update an existing session', async () => {
      redisSafeService.safeGet.mockResolvedValue(
        JSON.stringify(mockSessionData),
      );

      const updates = {
        progress: 50,
        serversProcessed: 1,
      };

      await service.updateSession('session-123', updates);

      expect(redisSafeService.safeSetEx).toHaveBeenCalledWith(
        'discovery:session:session-123',
        3600,
        JSON.stringify({
          ...mockSessionData,
          ...updates,
          updatedAt: new Date('2023-01-01T10:00:00Z'),
        }),
      );
    });

    it('should log warning if session not found', async () => {
      redisSafeService.safeGet.mockResolvedValue(null);

      await service.updateSession('session-123', { progress: 50 });

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Session session-123 not found for update',
      );
      expect(redisSafeService.safeSetEx).not.toHaveBeenCalled();
    });
  });

  describe('completeSession', () => {
    it('should complete a session and remove it from active if it was active', async () => {
      redisSafeService.safeGet
        .mockResolvedValueOnce(JSON.stringify(mockSessionData))
        .mockResolvedValueOnce('session-123');

      const results = {
        totalVmsDiscovered: 10,
        successfulServers: 2,
      };

      await service.completeSession('session-123', results);

      expect(redisSafeService.safeSetEx).toHaveBeenCalledWith(
        'discovery:session:session-123',
        3600,
        JSON.stringify({
          ...mockSessionData,
          ...results,
          status: DiscoveryStatus.COMPLETED,
          completedAt: new Date('2023-01-01T10:00:00Z'),
          updatedAt: new Date('2023-01-01T10:00:00Z'),
        }),
      );

      expect(redisSafeService.safeDel).toHaveBeenCalledWith('discovery:active');
    });

    it('should complete a session but not remove active if different session is active', async () => {
      redisSafeService.safeGet
        .mockResolvedValueOnce(JSON.stringify(mockSessionData))
        .mockResolvedValueOnce('different-session');

      await service.completeSession('session-123', {});

      expect(redisSafeService.safeDel).not.toHaveBeenCalled();
    });

    it('should handle session not found', async () => {
      redisSafeService.safeGet.mockResolvedValue(null);

      await service.completeSession('session-123', {});

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Session session-123 not found for update',
      );
    });
  });

  describe('cancelSession', () => {
    it('should cancel a session and remove it from active if it was active', async () => {
      redisSafeService.safeGet
        .mockResolvedValueOnce(JSON.stringify(mockSessionData))
        .mockResolvedValueOnce('session-123');

      await service.cancelSession('session-123');

      expect(redisSafeService.safeSetEx).toHaveBeenCalledWith(
        'discovery:session:session-123',
        3600,
        JSON.stringify({
          ...mockSessionData,
          status: DiscoveryStatus.CANCELLED,
          completedAt: new Date('2023-01-01T10:00:00Z'),
          updatedAt: new Date('2023-01-01T10:00:00Z'),
        }),
      );

      expect(redisSafeService.safeDel).toHaveBeenCalledWith('discovery:active');
    });

    it('should cancel a session but not remove active if different session is active', async () => {
      redisSafeService.safeGet
        .mockResolvedValueOnce(JSON.stringify(mockSessionData))
        .mockResolvedValueOnce('different-session');

      await service.cancelSession('session-123');

      expect(redisSafeService.safeDel).not.toHaveBeenCalled();
    });
  });

  describe('deleteSession', () => {
    it('should delete a session and remove it from active if it was active', async () => {
      redisSafeService.safeGet.mockResolvedValue('session-123');

      await service.deleteSession('session-123');

      expect(redisSafeService.safeDel).toHaveBeenCalledWith(
        'discovery:session:session-123',
      );
      expect(redisSafeService.safeDel).toHaveBeenCalledWith('discovery:active');
    });

    it('should delete a session but not remove active if different session is active', async () => {
      redisSafeService.safeGet.mockResolvedValue('different-session');

      await service.deleteSession('session-123');

      expect(redisSafeService.safeDel).toHaveBeenCalledWith(
        'discovery:session:session-123',
      );
      expect(redisSafeService.safeDel).toHaveBeenCalledTimes(1);
    });

    it('should delete a session even if active session check returns null', async () => {
      redisSafeService.safeGet.mockResolvedValue(null);

      await service.deleteSession('session-123');

      expect(redisSafeService.safeDel).toHaveBeenCalledWith(
        'discovery:session:session-123',
      );
      expect(redisSafeService.safeDel).toHaveBeenCalledTimes(1);
    });
  });

  describe('isSessionActive', () => {
    it('should return true if session is in DISCOVERING status', async () => {
      redisSafeService.safeGet.mockResolvedValue(
        JSON.stringify({
          ...mockSessionData,
          status: DiscoveryStatus.DISCOVERING,
        }),
      );

      const result = await service.isSessionActive('session-123');

      expect(result).toBe(true);
    });

    it('should return true if session is in STARTING status', async () => {
      redisSafeService.safeGet.mockResolvedValue(
        JSON.stringify({
          ...mockSessionData,
          status: DiscoveryStatus.STARTING,
        }),
      );

      const result = await service.isSessionActive('session-123');

      expect(result).toBe(true);
    });

    it('should return false if session is in COMPLETED status', async () => {
      redisSafeService.safeGet.mockResolvedValue(
        JSON.stringify({
          ...mockSessionData,
          status: DiscoveryStatus.COMPLETED,
        }),
      );

      const result = await service.isSessionActive('session-123');

      expect(result).toBe(false);
    });

    it('should return false if session is in ERROR status', async () => {
      redisSafeService.safeGet.mockResolvedValue(
        JSON.stringify({
          ...mockSessionData,
          status: DiscoveryStatus.ERROR,
        }),
      );

      const result = await service.isSessionActive('session-123');

      expect(result).toBe(false);
    });

    it('should return false if session is in CANCELLED status', async () => {
      redisSafeService.safeGet.mockResolvedValue(
        JSON.stringify({
          ...mockSessionData,
          status: DiscoveryStatus.CANCELLED,
        }),
      );

      const result = await service.isSessionActive('session-123');

      expect(result).toBe(false);
    });

    it('should return false if session does not exist', async () => {
      redisSafeService.safeGet.mockResolvedValue(null);

      const result = await service.isSessionActive('session-123');

      expect(result).toBe(false);
    });
  });
});