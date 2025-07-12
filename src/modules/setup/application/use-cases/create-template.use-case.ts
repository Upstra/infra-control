import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  CreateTemplateRequestDto,
  TemplateResponseDto,
  TemplateType,
} from '../dto';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { TemplateRepositoryInterface } from '../../domain/interfaces/template.repository.interface';
import { Template } from '../../domain/entities/template.entity';

@Injectable()
export class CreateTemplateUseCase {
  private readonly logger = new Logger(CreateTemplateUseCase.name);

  constructor(
    @Inject('TemplateRepositoryInterface')
    private readonly templateRepository: TemplateRepositoryInterface,
  ) {}

  async execute(
    dto: CreateTemplateRequestDto,
    currentUser: JwtPayload,
  ): Promise<TemplateResponseDto> {
    const template = new Template();
    template.name = dto.name;
    template.description = dto.description;
    template.type = TemplateType.CUSTOM;
    template.configuration = dto.configuration;
    template.createdBy = currentUser.email;

    const savedTemplate = await this.templateRepository.save(template);

    this.logger.log(
      `Created custom template '${savedTemplate.name}' by user ${currentUser.email}`,
    );

    return {
      id: savedTemplate.id,
      name: savedTemplate.name,
      description: savedTemplate.description,
      type: savedTemplate.type,
      configuration: savedTemplate.configuration,
      createdAt: savedTemplate.createdAt,
      createdBy: savedTemplate.createdBy,
    };
  }
}
