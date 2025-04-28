import { Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import {
  ServerDeletionException,
  ServerNotFoundException,
} from '@/modules/servers/domain/exceptions/server.exception';
import { DeleteIloUseCase } from '@/modules/ilos/application/use-cases';

@Injectable()
export class DeleteServerUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly deleteIloUsecase: DeleteIloUseCase,
  ) {}

  async execute(id: string): Promise<void> {
    try {
      await this.serverRepository.deleteServer(id);
      await this.deleteIloUsecase.execute(id);
    } catch (error) {
      if (error instanceof ServerNotFoundException) throw error;
      throw new ServerDeletionException(error.message);
    }
  }
}
