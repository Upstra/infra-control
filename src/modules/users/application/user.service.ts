import { Injectable, Inject } from '@nestjs/common';
import { UserRepositoryInterface } from '../domain/interfaces/user.repository.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  create() {
    return this.userRepository.hello();
  }
}
