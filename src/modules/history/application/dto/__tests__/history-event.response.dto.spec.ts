import { HistoryEventResponseDto } from '../history-event.response.dto';
import { HistoryEvent } from '../../../domain/entities/history-event.entity';
import { User } from '@/modules/users/domain/entities/user.entity';

describe('HistoryEventResponseDto', () => {
  it('should create a DTO with all basic fields', () => {
    const event = new HistoryEvent();
    event.id = 'event-123';
    event.entity = 'user';
    event.entityId = 'user-456';
    event.action = 'UPDATE';
    event.userId = 'user-789';
    event.createdAt = new Date('2024-01-01T00:00:00Z');

    const dto = new HistoryEventResponseDto(event);

    expect(dto.id).toBe('event-123');
    expect(dto.entity).toBe('user');
    expect(dto.entityId).toBe('user-456');
    expect(dto.action).toBe('UPDATE');
    expect(dto.userId).toBe('user-789');
    expect(dto.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(dto.user).toBeUndefined();
  });

  it('should include user data when present', () => {
    const user = new User();
    user.id = 'user-789';
    user.username = 'john.doe';
    user.email = 'john@example.com';

    const event = new HistoryEvent();
    event.id = 'event-123';
    event.entity = 'server';
    event.entityId = 'server-456';
    event.action = 'CREATE';
    event.userId = 'user-789';
    event.user = user;
    event.createdAt = new Date('2024-01-01T00:00:00Z');

    const dto = new HistoryEventResponseDto(event);

    expect(dto.user).toBeDefined();
    expect(dto.user?.id).toBe('user-789');
    expect(dto.user?.username).toBe('john.doe');
    expect(dto.user?.email).toBe('john@example.com');
  });

  it('should include all metadata fields when present', () => {
    const event = new HistoryEvent();
    event.id = 'event-123';
    event.entity = 'server';
    event.entityId = 'server-456';
    event.action = 'UPDATE';
    event.userId = 'user-789';
    event.createdAt = new Date('2024-01-01T00:00:00Z');
    event.oldValue = { status: 'running' };
    event.newValue = { status: 'stopped' };
    event.metadata = { reason: 'maintenance', duration: 3600 };
    event.ipAddress = '192.168.1.100';
    event.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
    event.correlationId = 'corr-123-456';

    const dto = new HistoryEventResponseDto(event);

    expect(dto.oldValue).toEqual({ status: 'running' });
    expect(dto.newValue).toEqual({ status: 'stopped' });
    expect(dto.metadata).toEqual({ reason: 'maintenance', duration: 3600 });
    expect(dto.ipAddress).toBe('192.168.1.100');
    expect(dto.userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    expect(dto.correlationId).toBe('corr-123-456');
  });

  it('should handle events without optional fields', () => {
    const event = new HistoryEvent();
    event.id = 'event-123';
    event.entity = 'vm';
    event.entityId = 'vm-456';
    event.action = 'DELETE';
    event.createdAt = new Date('2024-01-01T00:00:00Z');

    const dto = new HistoryEventResponseDto(event);

    expect(dto.id).toBe('event-123');
    expect(dto.entity).toBe('vm');
    expect(dto.entityId).toBe('vm-456');
    expect(dto.action).toBe('DELETE');
    expect(dto.userId).toBeUndefined();
    expect(dto.user).toBeUndefined();
    expect(dto.oldValue).toBeUndefined();
    expect(dto.newValue).toBeUndefined();
    expect(dto.metadata).toBeUndefined();
    expect(dto.ipAddress).toBeUndefined();
    expect(dto.userAgent).toBeUndefined();
    expect(dto.correlationId).toBeUndefined();
  });
});