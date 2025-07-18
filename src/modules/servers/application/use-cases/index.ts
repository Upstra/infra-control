import { GetUserServersUseCase } from './get-user-servers.use-case';
import { CreateServerUseCase } from './create-server.use-case';
import { DeleteServerUseCase } from './delete-server.use-case';
import { GetAllServersUseCase } from './get-all-servers.use-case';
import { GetServerByIdWithPermissionCheckUseCase } from './get-server-by-id-with-permission-check.use-case';
import { GetServerByIdUseCase } from './get-server-by-id.use-case';
import { UpdateServerUseCase } from './update-server.use-case';
import { UpdateServerPriorityUseCase } from './update-server-priority.use-case';
import { CheckServerPermissionUseCase } from './check-server-permission.use-case';
import { GetServerByIloIpUseCase } from './get-server-by-ilo-ip.use-case';
import { GetServerWithIloUseCase } from './get-server-with-ilo.use-case';
import { GetServersWithVmsUseCase } from './get-servers-with-vms.use-case';

export const ServerUseCases = [
  GetAllServersUseCase,
  GetServerByIdUseCase,
  CreateServerUseCase,
  UpdateServerUseCase,
  DeleteServerUseCase,
  GetUserServersUseCase,
  GetServerByIdWithPermissionCheckUseCase,
  UpdateServerPriorityUseCase,
  CheckServerPermissionUseCase,
  GetServerByIloIpUseCase,
  GetServerWithIloUseCase,
  GetServersWithVmsUseCase,
];

export {
  GetAllServersUseCase,
  GetServerByIdUseCase,
  CreateServerUseCase,
  UpdateServerUseCase,
  DeleteServerUseCase,
  GetUserServersUseCase,
  GetServerByIdWithPermissionCheckUseCase,
  UpdateServerPriorityUseCase,
  CheckServerPermissionUseCase,
  GetServerByIloIpUseCase,
  GetServerWithIloUseCase,
  GetServersWithVmsUseCase,
};
