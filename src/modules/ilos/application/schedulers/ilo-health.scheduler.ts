import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { CollectIloHealthUseCase } from '../use-cases/collect-ilo-health.use-case';

export const ILO_HEALTH_INTERVAL = 'ilo-health';
const LOCK_KEY = 'ilo:health:lock';
const DEFAULT_CONCURRENCY = 4;

export interface IloHealthRunResult {
  checked: number;
  failed: number;
}

@Injectable()
export class IloHealthScheduler
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(IloHealthScheduler.name);

  constructor(
    private readonly collectIloHealth: CollectIloHealthUseCase,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly redis: RedisSafeService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    if (this.configService.get('ILO_HEALTH_ENABLED') === 'false') return;
    this.schedulerRegistry.addInterval(
      ILO_HEALTH_INTERVAL,
      setInterval(
        () => this.run(),
        this.collectIloHealth.intervalSeconds() * 1000,
      ),
    );
  }

  onModuleDestroy(): void {
    if (this.schedulerRegistry.doesExist('interval', ILO_HEALTH_INTERVAL)) {
      this.schedulerRegistry.deleteInterval(ILO_HEALTH_INTERVAL);
    }
  }

  async run(): Promise<IloHealthRunResult | null> {
    const token = randomUUID();
    const acquired = await this.redis.safeSetNxEx(
      LOCK_KEY,
      this.collectIloHealth.intervalSeconds() * 2,
      token,
    );
    if (!acquired) return null;
    try {
      const servers = (
        await this.serverRepository.findAllWithCredentials()
      ).filter((server) => !!server.ilo);
      return await this.runWithConcurrency(servers, this.concurrency());
    } catch (error) {
      this.logger.error(`iLO health run failed: ${error?.message}`);
      return null;
    } finally {
      await this.redis.safeReleaseLock(LOCK_KEY, token);
    }
  }

  private async runWithConcurrency(
    servers: Server[],
    concurrency: number,
  ): Promise<IloHealthRunResult> {
    const result: IloHealthRunResult = { checked: 0, failed: 0 };
    const queue = [...servers];
    const worker = async () => {
      for (let server = queue.shift(); server; server = queue.shift()) {
        try {
          await this.collectIloHealth.execute(server);
          result.checked++;
        } catch (error) {
          result.failed++;
          this.logger.warn(
            `iLO health failed for ${server.name}: ${error?.message}`,
          );
        }
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(concurrency, servers.length) }, worker),
    );
    return result;
  }

  private concurrency(): number {
    return Math.max(
      1,
      Number(
        this.configService.get('ILO_HEALTH_CONCURRENCY') ?? DEFAULT_CONCURRENCY,
      ),
    );
  }
}
