import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { VmwareCacheServiceInterface } from '../interfaces/vmware-cache.service.interface';
import { Server } from '@modules/servers/domain/entities/server.entity';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import { EncryptionService } from '@/core/services/encryption';

@Injectable()
export class VmwareCacheService implements VmwareCacheServiceInterface {
  private readonly logger = new Logger(VmwareCacheService.name);

  constructor(
    private readonly redis: RedisSafeService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Set vCenter configuration in Redis
   * @param config vCenter connection configuration
   */
  async setVcenterConfig(config: {
    ip: string;
    user: string;
    password: string;
    port?: number;
  }): Promise<void> {
    const encryptedPassword = this.encryptionService.encrypt(config.password);

    const vcenterConfig = {
      ip: config.ip,
      user: config.user,
      password: encryptedPassword,
      port: config.port || 443,
    };
    this.logger.debug(
      `Setting vCenter config in Redis: ${JSON.stringify(vcenterConfig)}`,
    );

    await this.redis.safeSet('metrics:vcenter', JSON.stringify(vcenterConfig));
  }

  /**
   * Set elements to monitor in Redis
   * @param elements Array of VMs and Servers to monitor
   */
  async setElements(
    elements: Array<{ type: 'VM' | 'Server'; moid: string }>,
  ): Promise<void> {
    await this.redis.safeDel('metrics:elements');

    for (const element of elements) {
      await this.redis.safeLPush('metrics:elements', JSON.stringify(element));
    }
  }

  /**
   * Check if vCenter is configured in Redis
   * @returns true if configured, false otherwise
   */
  async isVcenterConfigured(): Promise<boolean> {
    const vcenterConfig = await this.redis.safeGet('metrics:vcenter');
    return !!vcenterConfig;
  }

  /**
   * Get vCenter configuration from Redis
   * @returns vCenter configuration or null if not configured
   */
  async getVcenterConfig(): Promise<any | null> {
    const config = await this.redis.safeGet('metrics:vcenter');
    return config ? JSON.parse(config) : null;
  }

  /**
   * Initialize vCenter configuration if not already configured
   * @param servers List of servers to extract vCenter config from
   */
  async initializeIfNeeded(servers: Server[]): Promise<void> {
    if (await this.isVcenterConfigured()) {
      return;
    }

    if (servers.length === 0) {
      throw new NotFoundException(
        'No servers available to extract vCenter configuration',
      );
    }

    const vcenter = servers.find((server) => server.type === 'vcenter');
    if (!vcenter) {
      throw new NotFoundException(
        'No vCenter server found in the provided list',
      );
    }

    await this.setVcenterConfig({
      ip: vcenter.ip,
      user: vcenter.login,
      password: vcenter.password,
      port: 443,
    });

    const elements: Array<{ type: 'VM' | 'Server'; moid: string }> = [];

    for (const server of servers) {
      if (server.vmwareHostMoid) {
        elements.push({ type: 'Server', moid: server.vmwareHostMoid });
      }
    }

    await this.setElements(elements);
  }

  /**
   * Get VM metrics from Redis cache
   * @param moid VM managed object ID
   * @returns VM metrics or null if not in cache
   */
  async getVmMetrics(moid: string): Promise<any | null> {
    const key = JSON.stringify({ type: 'VM', moid: moid });
    const data = await this.redis.safeHGet('metrics:metrics', key);
    this.logger.debug(
      `Fetching metrics for VM ${moid} from cache with key: ${key}`,
    );
    this.logger.debug(`Data fetched: ${data}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get server metrics from Redis cache
   * @param moid Server managed object ID
   * @returns Server metrics or null if not in cache
   */
  async getServerMetrics(moid: string): Promise<any | null> {
    const key = JSON.stringify({ type: 'Server', moid: moid });
    const data = await this.redis.safeHGet('metrics:metrics', key);
    this.logger.debug(
      `Fetching metrics for server ${moid} from cache with key: ${key}`,
    );
    this.logger.debug(`Data fetched: ${data}`);
    return data ? JSON.parse(data) : null;
  }
}
