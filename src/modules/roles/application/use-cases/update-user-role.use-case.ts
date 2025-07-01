import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UpdateUserFieldsUseCase } from '@/modules/users/application/use-cases';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(
    @Inject(forwardRef(() => UpdateUserFieldsUseCase))
    private readonly updateUserFields: UpdateUserFieldsUseCase,
  ) {}

  async execute(
    userId: string,
    roleId: string | null,
  ): Promise<UserResponseDto> {
    const user = await this.updateUserFields.execute(userId, { roleId });
    return new UserResponseDto(user);
  }
}
