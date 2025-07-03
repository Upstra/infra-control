import { ExecuteShutdownUseCase } from '../execute-shutdown.use-case';
import { PreviewShutdownUseCase } from '../preview-shutdown.use-case';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';
import { ShutdownPreviewResponseDto } from '../../dto/shutdown-preview.response.dto';

describe('ExecuteShutdownUseCase', () => {
  let useCase: ExecuteShutdownUseCase;
  let previewShutdownUseCase: jest.Mocked<PreviewShutdownUseCase>;
  let logHistoryUseCase: jest.Mocked<LogHistoryUseCase>;

  beforeEach(() => {
    previewShutdownUseCase = {
      execute: jest.fn(),
    } as any;

    logHistoryUseCase = {
      executeStructured: jest.fn(),
    } as any;

    useCase = new ExecuteShutdownUseCase(
      previewShutdownUseCase,
      logHistoryUseCase,
    );
  });

  it('should execute shutdown and log history for each step', async () => {
    const previewResponse: ShutdownPreviewResponseDto = {
      steps: [
        {
          order: 1,
          type: 'vm',
          entityId: 'vm-1',
          entityName: 'VM 1',
          groupId: 'group-vm-1',
          groupName: 'VM Group',
          priority: 1,
        },
        {
          order: 2,
          type: 'server',
          entityId: 'server-1',
          entityName: 'Server 1',
          groupId: 'group-server-1',
          groupName: 'Server Group',
          priority: 2,
        },
      ],
      totalVms: 1,
      totalServers: 1,
    };

    previewShutdownUseCase.execute.mockResolvedValue(previewResponse);

    const result = await useCase.execute(['group-1'], 'user-123');

    expect(previewShutdownUseCase.execute).toHaveBeenCalledWith(['group-1']);
    expect(logHistoryUseCase.executeStructured).toHaveBeenCalledTimes(2);
    expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith({
      entity: 'vm',
      entityId: 'vm-1',
      action: 'SHUTDOWN',
      userId: 'user-123',
      metadata: {
        groupId: 'group-vm-1',
        groupName: 'VM Group',
        shutdownOrder: 1,
        priority: 1,
      },
    });
    expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith({
      entity: 'server',
      entityId: 'server-1',
      action: 'SHUTDOWN',
      userId: 'user-123',
      metadata: {
        groupId: 'group-server-1',
        groupName: 'Server Group',
        shutdownOrder: 2,
        priority: 2,
      },
    });
    expect(result).toEqual(previewResponse);
  });

  it('should handle empty shutdown steps', async () => {
    const previewResponse: ShutdownPreviewResponseDto = {
      steps: [],
      totalVms: 0,
      totalServers: 0,
    };

    previewShutdownUseCase.execute.mockResolvedValue(previewResponse);

    const result = await useCase.execute([], 'user-123');

    expect(logHistoryUseCase.executeStructured).not.toHaveBeenCalled();
    expect(result).toEqual(previewResponse);
  });

  it('should fail if logging fails', async () => {
    const previewResponse: ShutdownPreviewResponseDto = {
      steps: [
        {
          order: 1,
          type: 'vm',
          entityId: 'vm-1',
          entityName: 'VM 1',
          groupId: 'group-vm-1',
          groupName: 'VM Group',
          priority: 1,
        },
      ],
      totalVms: 1,
      totalServers: 0,
    };

    previewShutdownUseCase.execute.mockResolvedValue(previewResponse);
    logHistoryUseCase.executeStructured.mockRejectedValue(
      new Error('Logging failed'),
    );

    await expect(useCase.execute(['group-1'], 'user-123')).rejects.toThrow(
      'Logging failed',
    );
  });
});
