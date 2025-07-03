import { Injectable } from '@nestjs/common';
import { GetUserByIdUseCase } from './get-user-by-id.use-case';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { UserResponseDto } from '../dto/user.response.dto';

/**
 * Retrieves the currently authenticated user’s profile.
 *
 * Responsibilities:
 * - Extracts user identity from JwtPayload context.
 * - Delegates to UserDomainService to fetch full user data.
 * - Returns UserDto for the calling user.
 *
 * @param userJwt  JwtPayload representing the authenticated session.
 * @returns        Promise<UserDto> the current user’s DTO.
 *
 * @throws UnauthorizedException if the token is invalid or expired.
 *
 * @example
 * const me = await getMeUseCase.execute(jwtPayload);
 */

@Injectable()
export class GetMeUseCase {
  constructor(private readonly getUserByIdUseCase: GetUserByIdUseCase) {}

  async execute(user: JwtPayload): Promise<UserResponseDto> {
    return this.getUserByIdUseCase.execute(user.userId);
  }
}
