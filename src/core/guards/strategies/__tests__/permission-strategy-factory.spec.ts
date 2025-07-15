import { PermissionStrategyFactoryImpl } from '@/core/guards';
import { ServerPermissionStrategy } from '@/core/guards';

describe('PermissionStrategyFactoryImpl', () => {
  let factory: PermissionStrategyFactoryImpl;
  let serverStrategy: jest.Mocked<ServerPermissionStrategy>;

  beforeEach(() => {
    serverStrategy = {
      checkPermission: jest.fn(),
    } as any;

    factory = new PermissionStrategyFactoryImpl(serverStrategy);
  });

  describe('getStrategy', () => {
    it('should return server strategy for "server" resource type', () => {
      const result = factory.getStrategy('server');

      expect(result).toBe(serverStrategy);
    });

    it('should throw error for unknown resource type', () => {
      expect(() => factory.getStrategy('unknown')).toThrow(
        'Unknown resource type: unknown. Available types: server',
      );
    });

    it('should throw error for empty string', () => {
      expect(() => factory.getStrategy('')).toThrow(
        'Unknown resource type: . Available types: server',
      );
    });

    it('should throw error for null resource type', () => {
      expect(() => factory.getStrategy(null as any)).toThrow(
        'Unknown resource type: null. Available types: server',
      );
    });

    it('should throw error for undefined resource type', () => {
      expect(() => factory.getStrategy(undefined as any)).toThrow(
        'Unknown resource type: undefined. Available types: server',
      );
    });

    it('should be case sensitive', () => {
      expect(() => factory.getStrategy('Server')).toThrow(
        'Unknown resource type: Server. Available types: server',
      );

      expect(() => factory.getStrategy('VM')).toThrow(
        'Unknown resource type: VM. Available types: server',
      );
    });
  });
});
