import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';

@Injectable()
export class DeleteUpsUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
  ) {}

  async execute(id: string): Promise<void> {
    await this.upsRepository.findUpsById(id);
    await this.upsRepository.deleteUps(id);
  }
}
