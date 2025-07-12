import { Injectable, Logger } from '@nestjs/common';
import {
  CreateTemplateRequestDto,
  TemplateResponseDto,
  TemplateType,
} from '../dto';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

@Injectable()
export class CreateTemplateUseCase {
  private readonly logger = new Logger(CreateTemplateUseCase.name);
  private readonly customTemplates: TemplateResponseDto[] = [];

  async execute(
    dto: CreateTemplateRequestDto,
    currentUser: JwtPayload,
  ): Promise<TemplateResponseDto> {
    const template: TemplateResponseDto = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: dto.name,
      description: dto.description,
      type: TemplateType.CUSTOM,
      configuration: dto.configuration,
      createdAt: new Date(),
      createdBy: currentUser.email,
    };

    this.customTemplates.push(template);

    this.logger.log(
      `Created custom template '${template.name}' by user ${currentUser.email}`,
    );

    return template;
  }
}
