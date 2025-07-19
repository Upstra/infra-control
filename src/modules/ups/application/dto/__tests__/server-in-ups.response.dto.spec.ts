import { ServerInUpsResponseDto } from '../server-in-ups.response.dto';
import { Server } from '../../../../servers/domain/entities/server.entity';

describe('ServerInUpsResponseDto', () => {
  describe('constructor', () => {
    it('should correctly map all server properties', () => {
      const mockServer: Server = {
        id: 'server-uuid',
        name: 'Test Server',
        ip: '192.168.1.10',
        state: 'UP',
        type: 'vcenter',
      } as Server;

      const dto = new ServerInUpsResponseDto(mockServer);

      expect(dto.id).toBe('server-uuid');
      expect(dto.name).toBe('Test Server');
      expect(dto.ip).toBe('192.168.1.10');
      expect(dto.state).toBe('UP');
      expect(dto.type).toBe('vcenter');
    });

    it('should handle different server states', () => {
      const serverStates = ['UP', 'DOWN', 'UNKNOWN'];

      serverStates.forEach((state) => {
        const server: Server = {
          id: 'test-id',
          name: 'Test',
          ip: '10.0.0.1',
          state,
          type: 'esxi',
        } as Server;

        const dto = new ServerInUpsResponseDto(server);
        expect(dto.state).toBe(state);
      });
    });

    it('should handle different server types', () => {
      const serverTypes = ['vcenter', 'esxi'];

      serverTypes.forEach((type) => {
        const server: Server = {
          id: 'test-id',
          name: 'Test',
          ip: '10.0.0.1',
          state: 'UP',
          type,
        } as Server;

        const dto = new ServerInUpsResponseDto(server);
        expect(dto.type).toBe(type);
      });
    });
  });
});
