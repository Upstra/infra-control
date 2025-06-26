import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

@Injectable()
export class DeleteUpsUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(id: string): Promise<void> {
    await this.upsRepository.findUpsById(id);
    await this.upsRepository.deleteUps(id);
    await this.logHistory?.execute('ups', id, 'DELETE');
  }
}
