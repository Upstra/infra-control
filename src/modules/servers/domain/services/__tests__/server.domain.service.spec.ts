import { ServerDomainService } from '../server.domain.service';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import {
  createMockServerCreationDto,
  createMockServerUpdateDto,
} from '@/modules/servers/__mocks__/servers.mock';

describe('ServerDomainService', () => {
  let service: ServerDomainService;

  beforeEach(() => {
    service = new ServerDomainService();
  });

  describe('createServerEntityFromDto', () => {
    it('should map all fields from ServerCreationDto to Server entity', () => {
      const dto = createMockServerCreationDto();
      const server = service.createServerEntityFromDto(dto);

      expect(server).toMatchObject({
        name: dto.name,
        state: dto.state,
        adminUrl: dto.adminUrl,
        ip: dto.ip,
        login: dto.login,
        password: dto.password,
        type: dto.type,
        priority: dto.priority,
        roomId: dto.roomId,
        groupId: dto.groupId,
        upsId: dto.upsId,
      });
    });
  });

  describe('updateServerEntityFromDto', () => {
    it('should update only provided fields', () => {
      const server = new Server();
      server.name = 'Initial';
      server.state = 'DOWN';
      server.priority = 5;
      server.roomId = 'new-room--uuid';

      const dto = createMockServerUpdateDto({
        name: 'Updated',
        priority: 2,
      });

      const updated = service.updateServerEntityFromDto(server, dto);

      expect(updated.name).toBe('Updated');
      expect(updated.priority).toBe(2);
      expect(updated.state).toBe('DOWN');
      expect(updated.roomId).toBe('new-room-uuid');
    });
  });
});
