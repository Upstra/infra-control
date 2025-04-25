import { CreateUpsUseCase } from './create-ups.use-case';
import { DeleteUpsUseCase } from './delete-ups.use-case';
import { GetAllUpsUseCase } from './get-all-ups.use-case';
import { GetUpsByIdUseCase } from './get-ups-by-id.use-case';
import { UpdateUpsUseCase } from './update-ups.use-case';

export const UpsUseCases = [
  CreateUpsUseCase,
  GetAllUpsUseCase,
  GetUpsByIdUseCase,
  UpdateUpsUseCase,
  DeleteUpsUseCase,
];

export {
  CreateUpsUseCase,
  GetAllUpsUseCase,
  GetUpsByIdUseCase,
  UpdateUpsUseCase,
  DeleteUpsUseCase,
};
