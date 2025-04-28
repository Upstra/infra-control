import { Injectable } from '@nestjs/common';
import { GetUserByIdUseCase } from './get-user-by-id.use-case';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { UserResponseDto } from '../dto/user.response.dto';

@Injectable()
export class GetMeUseCase {
  constructor(private readonly getUserByIdUseCase: GetUserByIdUseCase) {}

  async execute(user: JwtPayload): Promise<UserResponseDto> {
    return this.getUserByIdUseCase.execute(user.userId);
  }
}
