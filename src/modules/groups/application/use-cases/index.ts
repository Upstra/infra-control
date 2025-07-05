import { ExecuteGroupShutdownUseCase } from './execute-group-shutdown.use-case';
import { GetGroupUseCase } from './get-group.use-case';
import { CreateGroupUseCase } from './create-group.use-case';
import { UpdateGroupUseCase } from './update-group.use-case';
import { DeleteGroupUseCase } from './delete-group.use-case';
import { ListGroupsUseCase } from './list-groups.use-case';
import { PreviewGroupShutdownUseCase } from './preview-group-shutdown.use-case';

export const GroupUseCases = [
  ExecuteGroupShutdownUseCase,
  GetGroupUseCase,
  CreateGroupUseCase,
  UpdateGroupUseCase,
  DeleteGroupUseCase,
  ListGroupsUseCase,
  PreviewGroupShutdownUseCase,
];

export {
  ExecuteGroupShutdownUseCase,
  GetGroupUseCase,
  CreateGroupUseCase,
  UpdateGroupUseCase,
  DeleteGroupUseCase,
  ListGroupsUseCase,
  PreviewGroupShutdownUseCase,
};
