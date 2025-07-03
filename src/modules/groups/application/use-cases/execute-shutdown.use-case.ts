import { Injectable } from '@nestjs/common';
import { PreviewShutdownUseCase } from './preview-shutdown.use-case';
import { ShutdownPreviewResponseDto } from '../dto/shutdown-preview.response.dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

@Injectable()
export class ExecuteShutdownUseCase {
  constructor(
    private readonly previewShutdownUseCase: PreviewShutdownUseCase,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    groupIds: string[],
    userId?: string,
  ): Promise<ShutdownPreviewResponseDto> {
    // Get the shutdown sequence
    const preview = await this.previewShutdownUseCase.execute(groupIds);

    // TODO: In a real implementation, this would:
    // 1. Connect to hypervisors to shutdown VMs
    // 2. Connect to ILO/IPMI to shutdown servers
    // 3. Handle errors and retries
    // 4. Track progress and status

    // For now, we just log the action
    for (const step of preview.steps) {
      await this.logHistory?.executeStructured({
        entity: step.type === 'vm' ? 'vm' : 'server',
        entityId: step.entityId,
        action: 'SHUTDOWN',
        userId,
        metadata: {
          groupId: step.groupId,
          groupName: step.groupName,
          shutdownOrder: step.order,
          priority: step.priority,
        },
      });
    }

    return preview;
  }
}
