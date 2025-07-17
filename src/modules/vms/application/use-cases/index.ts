import { GetAllVmsUseCase } from './get-all-vms.use-case';
import { GetAllVmsAdminUseCase } from './get-all-vms-admin.use-case';
import { GetVmByIdUseCase } from './get-vm-by-id.use-case';
import { CreateVmUseCase } from './create-vm.use-case';
import { UpdateVmUseCase } from './update-vm.use-case';
import { DeleteVmUseCase } from './delete-vm.use-case';
import { GetVmListUseCase } from './get-vm-list.use-case';
import { UpdateVmPriorityUseCase } from './update-vm-priority.use-case';
import { CheckVmPermissionUseCase } from './check-vm-permission.use-case';
import { EnrichVmsWithMetricsUseCase } from './enrich-vms-with-metrics.use-case';
import { GetAllVmsWithMetricsUseCase } from './get-all-vms-with-metrics.use-case';
import { GetAllVmsAdminWithMetricsUseCase } from './get-all-vms-admin-with-metrics.use-case';
import { GetVmByIdWithMetricsUseCase } from './get-vm-by-id-with-metrics.use-case';
import { GetVmListWithMetricsUseCase } from './get-vm-list-with-metrics.use-case';

export const VmUseCase = [
  GetVmListUseCase,
  GetAllVmsUseCase,
  GetAllVmsAdminUseCase,
  GetVmByIdUseCase,
  CreateVmUseCase,
  UpdateVmUseCase,
  DeleteVmUseCase,
  UpdateVmPriorityUseCase,
  CheckVmPermissionUseCase,
  EnrichVmsWithMetricsUseCase,
  GetAllVmsWithMetricsUseCase,
  GetAllVmsAdminWithMetricsUseCase,
  GetVmByIdWithMetricsUseCase,
  GetVmListWithMetricsUseCase,
];

export {
  GetAllVmsUseCase,
  GetAllVmsAdminUseCase,
  GetVmByIdUseCase,
  CreateVmUseCase,
  UpdateVmUseCase,
  DeleteVmUseCase,
  GetVmListUseCase,
  UpdateVmPriorityUseCase,
  CheckVmPermissionUseCase,
  EnrichVmsWithMetricsUseCase,
  GetAllVmsWithMetricsUseCase,
  GetAllVmsAdminWithMetricsUseCase,
  GetVmByIdWithMetricsUseCase,
  GetVmListWithMetricsUseCase,
};
