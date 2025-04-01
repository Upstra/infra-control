import { Injectable, Inject } from '@nestjs/common';
import { UpsRepositoryInterface } from '../domain/interfaces/ups.repository.interface';

@Injectable()
export class UpsService {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
  ) {}

  create() {
    return this.upsRepository.hello();
  }
}
