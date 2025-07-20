import { GetGroupUseCase } from './get-group.use-case';
import { CreateGroupUseCase } from './create-group.use-case';
import { UpdateGroupUseCase } from './update-group.use-case';
import { DeleteGroupUseCase } from './delete-group.use-case';
import { ListGroupsUseCase } from './list-groups.use-case';

export const GroupUseCases = [
  GetGroupUseCase,
  CreateGroupUseCase,
  UpdateGroupUseCase,
  DeleteGroupUseCase,
  ListGroupsUseCase,
];

export {
  GetGroupUseCase,
  CreateGroupUseCase,
  UpdateGroupUseCase,
  DeleteGroupUseCase,
  ListGroupsUseCase,
};
