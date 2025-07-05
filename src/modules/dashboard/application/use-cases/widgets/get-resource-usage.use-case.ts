import { Injectable } from '@nestjs/common';
import { ResourceUsageResponseDto } from '../../dto/widget-data.dto';

@Injectable()
export class GetResourceUsageUseCase {
  async execute(): Promise<ResourceUsageResponseDto> {
    // TODO: Implement real resource monitoring
    // This is a placeholder implementation

    const now = new Date();
    const generateHistory = (baseValue: number) => {
      const history = [];
      for (let i = 5; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000);
        const variance = (Math.random() - 0.5) * 10;
        history.push({
          timestamp,
          value: Math.max(0, Math.min(100, baseValue + variance)),
        });
      }
      return history;
    };

    return {
      cpu: {
        usage: 65.5,
        trend: 'up',
        history: generateHistory(65),
      },
      memory: {
        usage: 78.2,
        trend: 'stable',
        total: '512GB',
        used: '400GB',
        history: generateHistory(78),
      },
      storage: {
        usage: 45.0,
        trend: 'up',
        total: '10TB',
        used: '4.5TB',
        history: generateHistory(45),
      },
      network: {
        inbound: '125 Mbps',
        outbound: '89 Mbps',
        trend: 'stable',
      },
    };
  }
}
