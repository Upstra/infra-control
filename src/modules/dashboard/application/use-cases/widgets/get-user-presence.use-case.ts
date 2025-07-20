import { Injectable, Inject } from '@nestjs/common';
import { PresenceService } from '../../../../presence/application/services/presence.service';
import { UserPresenceResponseDto, OnlineUserDto } from '../../dto/widget-data.dto';
import { UserRepositoryInterface } from '../../../../users/domain/interfaces/user.repository.interface';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';

@Injectable()
export class GetUserPresenceUseCase {
  constructor(
    @Inject(PresenceService)
    private readonly presenceService: PresenceService,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    @Inject(RedisSafeService)
    private readonly redisSafeService: RedisSafeService,
  ) {}

  async execute(): Promise<UserPresenceResponseDto> {
    const presenceKeys = await this.redisSafeService.keys('presence:*');
    
    if (!presenceKeys || presenceKeys.length === 0) {
      return {
        onlineUsers: [],
        recentlyOffline: [],
        summary: {
          online: 0,
          idle: 0,
          offline: 0,
        },
      };
    }

    const userIds = presenceKeys.map(key => key.replace('presence:', ''));
    const users = await this.userRepository.findByIds(userIds);
    
    const onlineUsers: OnlineUserDto[] = users.map(user => ({
      id: user.id,
      name: user.username,
      avatar: undefined,
      status: 'active' as const,
      location: 'Unknown',
      lastSeen: new Date(),
    }));

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
