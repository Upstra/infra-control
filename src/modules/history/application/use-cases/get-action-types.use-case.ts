import { Inject, Injectable } from '@nestjs/common';
import { HistoryRepositoryInterface } from '../../domain/interfaces/history.repository.interface';
import { ActionTypesResponseDto } from '../dto/action-types.response.dto';

@Injectable()
export class GetHistoryActionTypesUseCase {
  constructor(
    @Inject('HistoryRepositoryInterface')
    private readonly historyRepository: HistoryRepositoryInterface,
  ) {}

  async execute(): Promise<ActionTypesResponseDto> {
    const actionTypes = await this.historyRepository.findDistinctActionTypes();

    const categorizedActions: ActionTypesResponseDto = {
      create: [],
      update: [],
      delete: [],
      auth: [],
      server: [],
    };

    actionTypes.forEach((action) => {
      if (action.includes('CREATE') || action.includes('REGISTER')) {
        categorizedActions.create.push(action);
      } else if (
        action.includes('UPDATE') ||
        action.includes('ROLE_ASSIGNED') ||
        action.includes('ROLE_REMOVED') ||
        action.includes('PRIORITY_SWAP') ||
        action.includes('UPDATE_ROLE')
      ) {
        categorizedActions.update.push(action);
      } else if (action.includes('DELETE')) {
        categorizedActions.delete.push(action);
      } else if (
        action.includes('LOGIN') ||
        action.includes('LOGOUT') ||
        action.includes('2FA') ||
        action.includes('AUTH')
      ) {
        categorizedActions.auth.push(action);
      } else if (
        action.includes('START') ||
        action.includes('RESTART') ||
        action.includes('SHUTDOWN')
      ) {
        categorizedActions.server.push(action);
      } else {
        categorizedActions.update.push(action);
      }
    });

    return categorizedActions;
  }
}
