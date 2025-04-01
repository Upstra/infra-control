import { Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';

@Injectable()
export class UserTypeormRepository implements UserRepositoryInterface {
  hello(): string {
    return 'Hello from User Repository';
  }
}
