import { Injectable } from '@nestjs/common';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import { MigrationState } from '../../domain/interfaces/migration-orchestrator.interface';

const MIGRATION_STATE_KEY = 'migration:state';
const INACTIVE_STATES: string[] = [MigrationState.IDLE, MigrationState.FAILED];

@Injectable()
export class UpstraPlanStatusService {
  constructor(private readonly redis: RedisSafeService) {}

  async isActive(): Promise<boolean> {
    const state = await this.redis.safeGet(MIGRATION_STATE_KEY);
    return state !== null && !INACTIVE_STATES.includes(state);
  }
}
