import { Server } from '@modules/servers/domain/entities/server.entity';

export interface VmwareCacheServiceInterface {
  /**
   * Set vCenter configuration in Redis
   * @param config vCenter connection configuration
   */
  setVcenterConfig(config: {
    ip: string;
    user: string;
    password: string;
    port?: number;
  }): Promise<void>;

  /**
   * Set elements to monitor in Redis
   * @param elements Array of VMs and Servers to monitor
   */
  setElements(
    elements: Array<{ type: 'VM' | 'Server'; moid: string }>,
  ): Promise<void>;

  /**
   * Check if vCenter is configured in Redis
   * @returns true if configured, false otherwise
   */
  isVcenterConfigured(): Promise<boolean>;

  /**
   * Get vCenter configuration from Redis
   * @returns vCenter configuration or null if not configured
   */
  getVcenterConfig(): Promise<any | null>;

  /**
   * Initialize vCenter configuration if not already configured
   * @param servers List of servers to extract vCenter config from
   */
  initializeIfNeeded(servers: Server[]): Promise<void>;

  /**
   * Get VM metrics from Redis cache
   * @param moid VM managed object ID
   * @returns VM metrics or null if not in cache
   */
  getVmMetrics(moid: string): Promise<any | null>;

  /**
   * Get server metrics from Redis cache
   * @param moid Server managed object ID
   * @returns Server metrics or null if not in cache
   */
  getServerMetrics(moid: string): Promise<any | null>;
}