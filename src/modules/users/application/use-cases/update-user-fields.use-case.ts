import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class UpdateUserFieldsUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
  ) {}

  async execute(id: string, partialUser: Partial<User>): Promise<User> {
    await this.repo.updateFields(id, partialUser);
    const updated = await this.repo.findOneByField({
      field: 'id',
      value: id,
    });
    return updated;
  }
}
