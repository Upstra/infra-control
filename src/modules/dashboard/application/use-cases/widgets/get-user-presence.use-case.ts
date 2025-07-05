import { Injectable, Inject } from '@nestjs/common';
import { PresenceService } from '../../../../presence/application/services/presence.service';
import { UserPresenceResponseDto } from '../../dto/widget-data.dto';

@Injectable()
export class GetUserPresenceUseCase {
  constructor(
    @Inject(PresenceService)
    private readonly presenceService: PresenceService,
  ) {}

  async execute(): Promise<UserPresenceResponseDto> {
    // TODO: Implement actual user presence tracking
    // For now, return mock data
    const onlineCount = await this.presenceService.getConnectedUserCount();

    const onlineUsers = [];
    for (let i = 0; i < Math.min(onlineCount, 5); i++) {
      onlineUsers.push({
        id: `user-${i}`,
        name: `User ${i + 1}`,
        avatar: undefined,
        status: 'active' as const,
        location: 'Dashboard',
        lastSeen: new Date(),
      });
    }

    return {
      onlineUsers,
      recentlyOffline: [],
      summary: {
        online: onlineUsers.length,
        idle: 0,
        offline: 0,
      },
    };
  }
}
