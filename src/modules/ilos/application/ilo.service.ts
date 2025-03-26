import { Injectable, Inject } from '@nestjs/common';
import { IloRepositoryInterface } from '../domain/interfaces/ilo.repository.interface';

@Injectable()
export class IloService {
  constructor(
    @Inject('IloRepositoryInterface')
    private readonly iloRepository: IloRepositoryInterface,
  ) {}

  create() {
    return this.iloRepository.hello();
  }
}
