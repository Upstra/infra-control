import { CreateGroupServerUseCase } from './create-group-server.use-case';
import { GetAllGroupServerUseCase } from './get-all-group-server.use-case';
import { GetGroupServerByIdUseCase } from './get-group-server-by-id.use-case';
import { UpdateGroupServerUseCase } from './update-group-server.use-case';
import { DeleteGroupServerUseCase } from './delete-group-server.use-case';

export const GroupServerUseCases = [
  CreateGroupServerUseCase,
  GetAllGroupServerUseCase,
  GetGroupServerByIdUseCase,
  UpdateGroupServerUseCase,
  DeleteGroupServerUseCase,
];

export {
  CreateGroupServerUseCase,
  GetAllGroupServerUseCase,
  GetGroupServerByIdUseCase,
  UpdateGroupServerUseCase,
  DeleteGroupServerUseCase,
};
