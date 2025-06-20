import { Injectable, Inject } from '@nestjs/common';
import { SetupProgressRepositoryInterface } from '../../domain/interfaces/setup.repository.interface';

@Injectable()
export class GetSetupProgressUseCase {
  constructor(
    @Inject('SetupProgressRepositoryInterface')
    private readonly setupProgressRepo: SetupProgressRepositoryInterface,
  ) {}

  async execute() {
    return this.setupProgressRepo.findAll();
  }
}
