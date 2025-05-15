import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserDomainService } from '../../domain/services/user.domain.service';
import { ResetPasswordDto, UserResponseDto } from '../dto';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
    private readonly userDomainService: UserDomainService,
  ) {}

  async execute(id: string, dto: ResetPasswordDto): Promise<UserResponseDto> {
    const user = await this.repo.findOneByField({
      field: 'id',
      value: id,
    });
    user.password = await this.userDomainService.hashPassword(dto.newPassword);
    return new UserResponseDto(await this.repo.save(user));
  }
}
