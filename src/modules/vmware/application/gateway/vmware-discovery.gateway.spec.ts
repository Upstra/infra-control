import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { VmwareDiscoveryGateway } from './vmware-discovery.gateway';
import { DiscoveryProgressDto, DiscoveryStatus } from '../dto/discovery-progress.dto';
import { DiscoveryResultsDto, ServerDiscoveryResult } from '../dto/discovery-results.dto';
import { Logger } from '@nestjs/common';

describe('VmwareDiscoveryGateway', () => {
  let gateway: VmwareDiscoveryGateway;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<Socket>;
  let loggerSpy: jest.SpyInstance;
  let loggerDebugSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    mockSocket = {
      id: 'socket-123',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [VmwareDiscoveryGateway],
    }).compile();

    gateway = module.get<VmwareDiscoveryGateway>(VmwareDiscoveryGateway);
    gateway.server = mockServer as Server;

    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerDebugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should log client connection', () => {
      gateway.handleConnection(mockSocket as Socket);

      expect(loggerSpy).toHaveBeenCalledWith('Client connected: socket-123');
    });
  });

  describe('handleDisconnect', () => {
    it('should log client disconnection and cleanup sessions', () => {
      const cleanupSpy = jest.spyOn(gateway as any, 'cleanupClientSessions');
      
      gateway.handleDisconnect(mockSocket as Socket);

      expect(loggerSpy).toHaveBeenCalledWith('Client disconnected: socket-123');
      expect(cleanupSpy).toHaveBeenCalledWith('socket-123');
    });
  });

  describe('handleJoinSession', () => {
    it('should join client to session successfully', () => {
      const sessionId = 'session-123';

      gateway.handleJoinSession(sessionId, mockSocket as Socket);

      expect(mockSocket.join).toHaveBeenCalledWith(sessionId);
      expect(gateway.getClientsInSession(sessionId)).toBe(1);
      expect(loggerSpy).toHaveBeenCalledWith('Client socket-123 joined session session-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('joined', { sessionId });
    });

    it('should handle multiple clients joining same session', () => {
      const sessionId = 'session-123';
      const mockSocket2 = { ...mockSocket, id: 'socket-456' };

      gateway.handleJoinSession(sessionId, mockSocket as Socket);
      gateway.handleJoinSession(sessionId, mockSocket2 as Socket);

      expect(gateway.getClientsInSession(sessionId)).toBe(2);
      expect(gateway.getActiveSessionsCount()).toBe(1);
    });

    it('should emit error when sessionId is not provided', () => {
      gateway.handleJoinSession('', mockSocket as Socket);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Session ID is required' });
      expect(mockSocket.join).not.toHaveBeenCalled();
    });

    it('should emit error when sessionId is null', () => {
      gateway.handleJoinSession(null as any, mockSocket as Socket);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Session ID is required' });
      expect(mockSocket.join).not.toHaveBeenCalled();
    });

    it('should emit error when sessionId is undefined', () => {
      gateway.handleJoinSession(undefined as any, mockSocket as Socket);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Session ID is required' });
      expect(mockSocket.join).not.toHaveBeenCalled();
    });
  });

  describe('handleLeaveSession', () => {
    it('should remove client from session', () => {
      const sessionId = 'session-123';

      gateway.handleJoinSession(sessionId, mockSocket as Socket);
      gateway.handleLeaveSession(sessionId, mockSocket as Socket);

      expect(mockSocket.leave).toHaveBeenCalledWith(sessionId);
      expect(gateway.getClientsInSession(sessionId)).toBe(0);
      expect(gateway.getActiveSessionsCount()).toBe(0);
      expect(loggerSpy).toHaveBeenCalledWith('Client socket-123 left session session-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('left', { sessionId });
    });

    it('should not remove session when other clients are still connected', () => {
      const sessionId = 'session-123';
      const mockSocket2 = { ...mockSocket, id: 'socket-456' };

      gateway.handleJoinSession(sessionId, mockSocket as Socket);
      gateway.handleJoinSession(sessionId, mockSocket2 as Socket);
      gateway.handleLeaveSession(sessionId, mockSocket as Socket);

      expect(gateway.getClientsInSession(sessionId)).toBe(1);
      expect(gateway.getActiveSessionsCount()).toBe(1);
    });

    it('should handle leaving non-existent session', () => {
      const sessionId = 'non-existent';

      gateway.handleLeaveSession(sessionId, mockSocket as Socket);

      expect(mockSocket.leave).toHaveBeenCalledWith(sessionId);
      expect(mockSocket.emit).toHaveBeenCalledWith('left', { sessionId });
    });
  });

  describe('emitDiscoveryProgress', () => {
    const progress: DiscoveryProgressDto = {
      status: DiscoveryStatus.DISCOVERING,
      currentServer: 'server-1',
      progress: 50,
      serversProcessed: 1,
      totalServers: 2,
      discoveredVms: 5,
    };

    it('should emit progress to session', () => {
      const sessionId = 'session-123';
      const mockDate = new Date('2024-01-01');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      gateway.emitDiscoveryProgress(sessionId, progress);

      expect(mockServer.to).toHaveBeenCalledWith(sessionId);
      expect(mockServer.emit).toHaveBeenCalledWith('discovery:progress', {
        ...progress,
        timestamp: mockDate,
      });
      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'Emitted progress to session session-123: discovering'
      );
    });

    it('should warn when sessionId is empty', () => {
      gateway.emitDiscoveryProgress('', progress);

      expect(loggerWarnSpy).toHaveBeenCalledWith('Cannot emit progress: sessionId is required');
      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it('should warn when sessionId is null', () => {
      gateway.emitDiscoveryProgress(null as any, progress);

      expect(loggerWarnSpy).toHaveBeenCalledWith('Cannot emit progress: sessionId is required');
      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it('should handle progress with error status', () => {
      const errorProgress: DiscoveryProgressDto = {
        status: DiscoveryStatus.ERROR,
        error: 'Connection failed',
      };

      gateway.emitDiscoveryProgress('session-123', errorProgress);

      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'Emitted progress to session session-123: error'
      );
    });
  });

  describe('emitDiscoveryComplete', () => {
    const results: DiscoveryResultsDto = {
      totalVmsDiscovered: 10,
      totalServersProcessed: 2,
      successfulServers: 2,
      failedServers: 0,
      serverResults: [
        {
          serverId: '1',
          serverName: 'server-1',
          success: true,
          vmCount: 5,
          vms: [],
        } as ServerDiscoveryResult,
      ],
      allDiscoveredVms: [],
    };

    it('should emit completion results to session', () => {
      const sessionId = 'session-123';

      gateway.emitDiscoveryComplete(sessionId, results);

      expect(mockServer.to).toHaveBeenCalledWith(sessionId);
      expect(mockServer.emit).toHaveBeenCalledWith('discovery:complete', results);
      expect(loggerSpy).toHaveBeenCalledWith(
        'Emitted completion to session session-123: 10 VMs discovered'
      );
    });

    it('should warn when sessionId is empty', () => {
      gateway.emitDiscoveryComplete('', results);

      expect(loggerWarnSpy).toHaveBeenCalledWith('Cannot emit completion: sessionId is required');
      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it('should warn when sessionId is null', () => {
      gateway.emitDiscoveryComplete(null as any, results);

      expect(loggerWarnSpy).toHaveBeenCalledWith('Cannot emit completion: sessionId is required');
      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it('should handle results with zero VMs discovered', () => {
      const emptyResults: DiscoveryResultsDto = {
        ...results,
        totalVmsDiscovered: 0,
      };

      gateway.emitDiscoveryComplete('session-123', emptyResults);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Emitted completion to session session-123: 0 VMs discovered'
      );
    });
  });

  describe('emitDiscoveryError', () => {
    it('should emit error to session', () => {
      const sessionId = 'session-123';
      const error = 'Connection timeout';
      const mockDate = new Date('2024-01-01');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      gateway.emitDiscoveryError(sessionId, error);

      expect(mockServer.to).toHaveBeenCalledWith(sessionId);
      expect(mockServer.emit).toHaveBeenCalledWith('discovery:error', {
        error,
        timestamp: mockDate,
      });
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Emitted error to session session-123: Connection timeout'
      );
    });

    it('should warn when sessionId is empty', () => {
      gateway.emitDiscoveryError('', 'Some error');

      expect(loggerWarnSpy).toHaveBeenCalledWith('Cannot emit error: sessionId is required');
      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it('should warn when sessionId is null', () => {
      gateway.emitDiscoveryError(null as any, 'Some error');

      expect(loggerWarnSpy).toHaveBeenCalledWith('Cannot emit error: sessionId is required');
      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  describe('getActiveSessionsCount', () => {
    it('should return 0 when no sessions', () => {
      expect(gateway.getActiveSessionsCount()).toBe(0);
    });

    it('should return correct count of active sessions', () => {
      gateway.handleJoinSession('session-1', mockSocket as Socket);
      gateway.handleJoinSession('session-2', { ...mockSocket, id: 'socket-456' } as Socket);

      expect(gateway.getActiveSessionsCount()).toBe(2);
    });
  });

  describe('getClientsInSession', () => {
    it('should return 0 for non-existent session', () => {
      expect(gateway.getClientsInSession('non-existent')).toBe(0);
    });

    it('should return correct client count', () => {
      const sessionId = 'session-123';
      const mockSocket2 = { ...mockSocket, id: 'socket-456' };

      gateway.handleJoinSession(sessionId, mockSocket as Socket);
      gateway.handleJoinSession(sessionId, mockSocket2 as Socket);

      expect(gateway.getClientsInSession(sessionId)).toBe(2);
    });
  });

  describe('cleanupClientSessions', () => {
    it('should remove client from all sessions', () => {
      const mockSocket2 = { ...mockSocket, id: 'socket-456' };

      gateway.handleJoinSession('session-1', mockSocket as Socket);
      gateway.handleJoinSession('session-1', mockSocket2 as Socket);
      gateway.handleJoinSession('session-2', mockSocket as Socket);

      expect(gateway.getActiveSessionsCount()).toBe(2);

      (gateway as any).cleanupClientSessions('socket-123');

      expect(gateway.getClientsInSession('session-1')).toBe(1);
      expect(gateway.getClientsInSession('session-2')).toBe(0);
      expect(gateway.getActiveSessionsCount()).toBe(1);
    });

    it('should log when cleaning up empty sessions', () => {
      gateway.handleJoinSession('session-1', mockSocket as Socket);
      
      (gateway as any).cleanupClientSessions('socket-123');

      expect(loggerSpy).toHaveBeenCalledWith('Cleaned up empty session: session-1');
    });

    it('should handle cleanup when client is not in any session', () => {
      gateway.handleJoinSession('session-1', mockSocket as Socket);
      
      (gateway as any).cleanupClientSessions('non-existent-client');

      expect(gateway.getClientsInSession('session-1')).toBe(1);
      expect(gateway.getActiveSessionsCount()).toBe(1);
    });
  });
});