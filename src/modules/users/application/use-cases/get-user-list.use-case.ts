import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserResponseDto } from '../dto/user.response.dto';
import { UserListResponseDto } from '../dto/user.list.response.dto';

@Injectable()
export class GetUserListUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
  ) {}

  /**
   * Retrieve a paginated list of users.
   *
   * @param page - page number starting at 1
   * @param limit - number of users per page
   */
  async execute(page = 1, limit = 10): Promise<UserListResponseDto> {
    const [users, total] = await this.repo.paginate(page, limit, ['role']);
    const dtos = users.map((u) => new UserResponseDto(u));
    return new UserListResponseDto(dtos, total, page, limit);
  }
}
