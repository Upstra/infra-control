import { Injectable, Inject } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';

@Injectable()
export class DeleteIloUseCase {
  constructor(
    @Inject('IloRepositoryInterface')
    private readonly iloRepository: IloRepositoryInterface,
  ) {}

  async execute(id: string): Promise<void> {
    await this.iloRepository.deleteIlo(id);
  }
}
