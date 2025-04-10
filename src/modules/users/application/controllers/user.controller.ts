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
import {
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

@ApiTags('User')
@Controller('user')
export class UserController implements UserEndpointInterface {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer son propre profil utilisateur',
    description:
      'Renvoie les informations du profil utilisateur actuellement connecté via le JWT.',
  })
  async getMe(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.userService.getMe(user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de l’utilisateur à récupérer',
    required: true,
  })
  @ApiOperation({
    summary: 'Récupérer un utilisateur par son ID',
    description:
      'Renvoie les informations de l’utilisateur correspondant à l’ID fourni. Requiert une authentification.',
  })
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.userService.getUserById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de l’utilisateur à mettre à jour',
    required: true,
  })
  @ApiBody({
    type: UserUpdateDto,
    description: 'Données pour mettre à jour un utilisateur',
    required: true,
  })
  @ApiOperation({
    summary: 'Mettre à jour un utilisateur',
    description:
      'Met à jour les informations d’un utilisateur spécifique à partir de son UUID. Authentification requise.',
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
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de l’utilisateur à supprimer',
    required: true,
  })
  @ApiOperation({
    summary: 'Supprimer un utilisateur',
    description:
      'Supprime un utilisateur en fonction de son UUID. Cette action est irréversible. Authentification requise.',
  })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.userService.deleteUser(id);
  }
}
