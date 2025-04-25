import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import {
  UpsNotFoundException,
  UpsDeletionException,
} from '../../domain/exceptions/ups.exception';

@Injectable()
export class DeleteUpsUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
  ) {}

  async execute(id: string): Promise<void> {
    try {
      await this.upsRepository.deleteUps(id);
    } catch (error) {
      if (error instanceof UpsNotFoundException) throw error;
      throw new UpsDeletionException(error.message);
    }
  }
}
