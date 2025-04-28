import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserResponseDto } from '../dto/user.response.dto';
import { UserUpdateDto } from '../dto/user.update.dto';
import { UserDomainService } from '../../domain/services/user.domain.service';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
    private readonly userDomainService: UserDomainService,
  ) {}

  async execute(id: string, dto: UserUpdateDto): Promise<UserResponseDto> {
    let user = await this.repo.findOneByField('id', id);

    user = await this.userDomainService.updateUserEntity(user, dto);
    user = await this.repo.save(user);
    return new UserResponseDto(user);
  }
}
