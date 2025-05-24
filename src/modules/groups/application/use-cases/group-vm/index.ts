import { CreateGroupVmUseCase } from './create-group-vm.use-case';
import { GetAllGroupVmUseCase } from './get-all-group-vm.use-case';
import { GetGroupVmByIdUseCase } from './get-group-vm-by-id.use-case';
import { UpdateGroupVmUseCase } from './update-group-vm.use-case';
import { DeleteGroupVmUseCase } from './delete-group-vm.use-case';

export const GroupVmUseCases = [
  CreateGroupVmUseCase,
  GetAllGroupVmUseCase,
  GetGroupVmByIdUseCase,
  UpdateGroupVmUseCase,
  DeleteGroupVmUseCase,
];

export {
  CreateGroupVmUseCase,
  GetAllGroupVmUseCase,
  GetGroupVmByIdUseCase,
  UpdateGroupVmUseCase,
  DeleteGroupVmUseCase,
};
