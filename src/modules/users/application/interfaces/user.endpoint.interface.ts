import { UserResponseDto } from '../dto/user.response.dto';
import { UserUpdateDto } from '../dto/user.update.dto';

export interface UserEndpointInterface {
  getUserById(id: string): Promise<UserResponseDto>;
  updateUser(
    id: string,
    updateUserDto: UserUpdateDto,
  ): Promise<UserResponseDto>;
  deleteUser(id: string): Promise<void>;
}
