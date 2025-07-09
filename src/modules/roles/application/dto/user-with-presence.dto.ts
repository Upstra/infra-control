import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';

export class UserWithPresenceDto extends UserResponseDto {
  @ApiProperty({
    description: 'Indicates if the user is currently online',
    example: true,
  })
  isOnline: boolean;
}