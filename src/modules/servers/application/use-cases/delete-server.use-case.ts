import { Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';

import { DeleteIloUseCase } from '@/modules/ilos/application/use-cases';

@Injectable()
export class DeleteServerUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly deleteIloUsecase: DeleteIloUseCase,
  ) {}

  async execute(id: string): Promise<void> {
    await this.serverRepository.deleteServer(id);
    await this.deleteIloUsecase.execute(id);
  }
}
