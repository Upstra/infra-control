import {
  ShutdownStep,
  ShutdownPreviewResponseDto,
} from '../shutdown-preview.response.dto';

describe('ShutdownStep', () => {
  it('should create instance with all properties', () => {
    const step = new ShutdownStep({
      order: 1,
      type: 'vm',
      entityId: 'entity-123',
      entityName: 'Test Entity',
      groupId: 'group-123',
      groupName: 'Test Group',
      priority: 3,
    });

    expect(step.order).toBe(1);
    expect(step.type).toBe('vm');
    expect(step.entityId).toBe('entity-123');
    expect(step.entityName).toBe('Test Entity');
    expect(step.groupId).toBe('group-123');
    expect(step.groupName).toBe('Test Group');
    expect(step.priority).toBe(3);
  });

  it('should use default values when properties are undefined', () => {
    const step = new ShutdownStep({});

    expect(step.order).toBe(0);
    expect(step.type).toBe('vm');
    expect(step.entityId).toBe('');
    expect(step.entityName).toBe('');
    expect(step.groupId).toBe('');
    expect(step.groupName).toBe('');
    expect(step.priority).toBe(0);
  });

  it('should handle partial data correctly', () => {
    const step = new ShutdownStep({
      order: 5,
      type: 'server',
      entityName: 'Server 1',
    });

    expect(step.order).toBe(5);
    expect(step.type).toBe('server');
    expect(step.entityId).toBe('');
    expect(step.entityName).toBe('Server 1');
    expect(step.groupId).toBe('');
    expect(step.groupName).toBe('');
    expect(step.priority).toBe(0);
  });

  it('should not copy unexpected properties', () => {
    const step = new ShutdownStep({
      order: 1,
      type: 'vm',
      unexpectedProperty: 'should not be copied',
    } as any);

    expect(step.order).toBe(1);
    expect(step.type).toBe('vm');
    expect((step as any).unexpectedProperty).toBeUndefined();
  });
});

describe('ShutdownPreviewResponseDto', () => {
  it('should calculate totals correctly', () => {
    const steps: ShutdownStep[] = [
      new ShutdownStep({ type: 'vm' }),
      new ShutdownStep({ type: 'vm' }),
      new ShutdownStep({ type: 'server' }),
    ];

    const dto = new ShutdownPreviewResponseDto(steps);

    expect(dto.steps).toEqual(steps);
    expect(dto.totalVms).toBe(2);
    expect(dto.totalServers).toBe(1);
  });

  it('should handle empty steps array', () => {
    const dto = new ShutdownPreviewResponseDto([]);

    expect(dto.steps).toEqual([]);
    expect(dto.totalVms).toBe(0);
    expect(dto.totalServers).toBe(0);
  });

  it('should handle all VMs', () => {
    const steps: ShutdownStep[] = [
      new ShutdownStep({ type: 'vm' }),
      new ShutdownStep({ type: 'vm' }),
      new ShutdownStep({ type: 'vm' }),
    ];

    const dto = new ShutdownPreviewResponseDto(steps);

    expect(dto.totalVms).toBe(3);
    expect(dto.totalServers).toBe(0);
  });

  it('should handle all servers', () => {
    const steps: ShutdownStep[] = [
      new ShutdownStep({ type: 'server' }),
      new ShutdownStep({ type: 'server' }),
    ];

    const dto = new ShutdownPreviewResponseDto(steps);

    expect(dto.totalVms).toBe(0);
    expect(dto.totalServers).toBe(2);
  });
});
