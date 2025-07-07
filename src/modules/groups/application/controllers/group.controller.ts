import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { GroupResponseDto } from '../dto/group-response.dto';
import { GroupQueryDto } from '../dto/group-query.dto';
import { PaginatedGroupResponseDto } from '../dto/paginated-group-response.dto';
import { CreateGroupUseCase } from '../use-cases/create-group.use-case';
import { UpdateGroupUseCase } from '../use-cases/update-group.use-case';
import { DeleteGroupUseCase } from '../use-cases/delete-group.use-case';
import { GetGroupUseCase } from '../use-cases/get-group.use-case';
import { ListGroupsUseCase } from '../use-cases/list-groups.use-case';

@ApiTags('Groups')
@Controller('groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GroupController {
  constructor(
    private readonly createGroupUseCase: CreateGroupUseCase,
    private readonly updateGroupUseCase: UpdateGroupUseCase,
    private readonly deleteGroupUseCase: DeleteGroupUseCase,
    private readonly getGroupUseCase: GetGroupUseCase,
    private readonly listGroupsUseCase: ListGroupsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all groups with pagination' })
  async list(
    @Query() query: GroupQueryDto,
  ): Promise<PaginatedGroupResponseDto> {
    return this.listGroupsUseCase.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group by ID' })
  async get(@Param('id', ParseUUIDPipe) id: string): Promise<GroupResponseDto> {
    return this.getGroupUseCase.execute(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new group' })
  async create(
    @Body() dto: CreateGroupDto,
    @CurrentUser() user: { id: string },
  ): Promise<GroupResponseDto> {
    return this.createGroupUseCase.execute(dto, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a group' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupDto,
    @CurrentUser() user: { id: string },
  ): Promise<GroupResponseDto> {
    return this.updateGroupUseCase.execute(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a group' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ): Promise<void> {
    return this.deleteGroupUseCase.execute(id, user.id);
  }
}
