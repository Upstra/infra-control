import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserResponseDto } from '../dto/user.response.dto';
import { UserUpdateDto } from '../dto/user.update.dto';
import { UserDomainService } from '../../domain/services/user.domain.service';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
    private readonly userDomainService: UserDomainService,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(id: string, dto: UserUpdateDto): Promise<UserResponseDto> {
    let user = await this.repo.findOneByField({
      field: 'id',
      value: id,
    });

    await this.userDomainService.ensureUniqueEmail(dto.email, id);
    await this.userDomainService.ensureUniqueUsername(dto.username, id);
    user = await this.userDomainService.updateUserEntity(user, dto);
    user = await this.repo.save(user);
    await this.logHistory?.execute('user', user.id, 'UPDATE');
    return new UserResponseDto(user);
  }
}
