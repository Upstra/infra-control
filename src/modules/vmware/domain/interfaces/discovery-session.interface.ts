import { DiscoveryStatus } from '../../application/dto';
import { ServerDiscoveryResult } from '../services/vmware-discovery.service';

export interface DiscoverySessionData {
  sessionId: string;
  status: DiscoveryStatus;
  totalServers: number;
  serversProcessed: number;
  successfulServers: number;
  failedServers: number;
  totalVmsDiscovered: number;
  serverResults: ServerDiscoveryResult[];
  failedServerIds: string[];
  currentServer?: string;
  progress: number;
  error?: string;
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
