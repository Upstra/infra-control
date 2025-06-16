import { PermissionStrategyFactoryImpl } from '../permission-strategy.factory';
import { ServerPermissionStrategy } from '../server-permission.strategy';
import { VmPermissionStrategy } from '../vm-permission.strategy';

describe('PermissionStrategyFactoryImpl', () => {
  let factory: PermissionStrategyFactoryImpl;
  let serverStrategy: jest.Mocked<ServerPermissionStrategy>;
  let vmStrategy: jest.Mocked<VmPermissionStrategy>;

  beforeEach(() => {
    serverStrategy = {
      checkPermission: jest.fn(),
    } as any;

    vmStrategy = {
      checkPermission: jest.fn(),
    } as any;

    factory = new PermissionStrategyFactoryImpl(serverStrategy, vmStrategy);
  });

  describe('getStrategy', () => {
    it('should return server strategy for "server" resource type', () => {
      const result = factory.getStrategy('server');

      expect(result).toBe(serverStrategy);
    });

    it('should return vm strategy for "vm" resource type', () => {
      const result = factory.getStrategy('vm');

      expect(result).toBe(vmStrategy);
    });

    it('should throw error for unknown resource type', () => {
      expect(() => factory.getStrategy('unknown')).toThrow(
        'Unknown resource type: unknown. Available types: server, vm',
      );
    });

    it('should throw error for empty string', () => {
      expect(() => factory.getStrategy('')).toThrow(
        'Unknown resource type: . Available types: server, vm',
      );
    });

    it('should throw error for null resource type', () => {
      expect(() => factory.getStrategy(null as any)).toThrow(
        'Unknown resource type: null. Available types: server, vm',
      );
    });

    it('should throw error for undefined resource type', () => {
      expect(() => factory.getStrategy(undefined as any)).toThrow(
        'Unknown resource type: undefined. Available types: server, vm',
      );
    });

    it('should be case sensitive', () => {
      expect(() => factory.getStrategy('Server')).toThrow(
        'Unknown resource type: Server. Available types: server, vm',
      );

      expect(() => factory.getStrategy('VM')).toThrow(
        'Unknown resource type: VM. Available types: server, vm',
      );
    });
  });
});
