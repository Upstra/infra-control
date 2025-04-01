import { Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
@Injectable()
export class RoleTypeormRepository implements RoleRepositoryInterface {
  hello(): string {
    return 'Hello from Role Repository';
  }
}
