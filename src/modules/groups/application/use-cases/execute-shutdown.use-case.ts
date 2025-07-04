import { Injectable } from '@nestjs/common';
import { PreviewShutdownUseCase } from './preview-shutdown.use-case';
import { ShutdownPreviewListResponseDto } from '../dto/shutdown-preview.list.response.dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

@Injectable()
export class ExecuteShutdownUseCase {
  constructor(
    private readonly previewShutdownUseCase: PreviewShutdownUseCase,
    private readonly logHistory: LogHistoryUseCase,
  ) {}

  async execute(
    groupIds: string[],
    userId?: string,
    page = 1,
    limit = 10,
  ): Promise<ShutdownPreviewListResponseDto> {
    const fullPreview = await this.previewShutdownUseCase.execute(
      groupIds,
      1,
      Number.MAX_SAFE_INTEGER,
    );

    // TODO: In a real implementation, this would:
    // 1. Connect to hypervisors to shutdown VMs
    // 2. Connect to ILO/IPMI to shutdown servers
    // 3. Handle errors and retries
    // 4. Track progress and status
    for (const step of fullPreview.items) {
      try {
        await this.logHistory.executeStructured({
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
      } catch (error) {
        console.error(`Failed to log shutdown for ${step.type} ${step.entityId}:`, error);
      }
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = fullPreview.items.slice(startIndex, endIndex);

    const totalVms = fullPreview.items.filter(s => s.type === 'vm').length;
    const totalServers = fullPreview.items.filter(s => s.type === 'server').length;

    return new ShutdownPreviewListResponseDto(
      paginatedItems,
      fullPreview.totalItems,
      page,
      limit,
      totalVms,
      totalServers,
    );
  }
}
