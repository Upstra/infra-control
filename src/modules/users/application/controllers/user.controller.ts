import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { UserResponseDto } from '../dto/user.response.dto';
import { UserEndpointInterface } from '../interfaces/user.endpoint.interface';
import { UserUpdateDto } from '../dto/user.update.dto';
import { ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

@Controller('user')
export class UserController implements UserEndpointInterface {
  constructor(private readonly userService: UserService) { }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMe(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.userService.getMe(user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam(
    { name: 'id', type: String, description: 'User ID', required: true },
  )
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.userService.getUserById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam(
    { name: 'id', type: String, description: 'User ID', required: true },
  )
  @ApiBody({
    type: UserUpdateDto,
    description: 'User Update DTO',
    required: true,
  })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UserUpdateDto,
  ): Promise<UserResponseDto> {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam(
    { name: 'id', type: String, description: 'User ID', required: true },
  )
  async deleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.userService.deleteUser(id);
  }
}
