import { Injectable, Inject } from '@nestjs/common';
import { SalleRepositoryInterface } from '../domain/interfaces/salle.repository.interface';

@Injectable()
export class SalleService {
  constructor(
    @Inject('SalleRepositoryInterface')
    private readonly salleRepository: SalleRepositoryInterface,
  ) {}

  create() {
    return this.salleRepository.hello();
  }
}
