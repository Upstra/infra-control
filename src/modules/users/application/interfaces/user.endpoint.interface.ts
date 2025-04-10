import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { UserResponseDto } from '../dto/user.response.dto';
import { UserUpdateDto } from '../dto/user.update.dto';

export interface UserEndpointInterface {
  getMe(user: JwtPayload): Promise<UserResponseDto>;
  getUserById(id: string): Promise<UserResponseDto>;
  updateUser(id: string, updateUserDto: UserUpdateDto): Promise<UserResponseDto>;
  deleteUser(id: string): Promise<void>;
}
