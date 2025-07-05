import { GetAllVmsUseCase } from './get-all-vms.use-case';
import { GetVmByIdUseCase } from './get-vm-by-id.use-case';
import { CreateVmUseCase } from './create-vm.use-case';
import { UpdateVmUseCase } from './update-vm.use-case';
import { DeleteVmUseCase } from './delete-vm.use-case';
import { GetVmListUseCase } from './get-vm-list.use-case';
import { UpdateVmPriorityUseCase } from './update-vm-priority.use-case';

export const VmUseCase = [
  GetVmListUseCase,
  GetAllVmsUseCase,
  GetVmByIdUseCase,
  CreateVmUseCase,
  UpdateVmUseCase,
  DeleteVmUseCase,
  UpdateVmPriorityUseCase,
];

export {
  GetAllVmsUseCase,
  GetVmByIdUseCase,
  CreateVmUseCase,
  UpdateVmUseCase,
  DeleteVmUseCase,
  GetVmListUseCase,
  UpdateVmPriorityUseCase,
};
