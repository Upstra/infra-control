import { Injectable, Inject } from '@nestjs/common';
import { OnduleurRepositoryInterface } from '../domain/interfaces/onduleur.repository.interface';

@Injectable()
export class OnduleurService {
  constructor(
    @Inject('OnduleurRepositoryInterface')
    private readonly onduleurRepository: OnduleurRepositoryInterface,
  ) {}

  create() {
    return this.onduleurRepository.hello();
  }
}
