import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { 
  CreateTemplateRequestDto, 
  TemplateResponseDto, 
  TemplateType 
} from '../dto';
import { CurrentUserInterface } from '../../../auth/domain/interfaces/current-user.interface';

@Injectable()
export class CreateTemplateUseCase {
  private readonly logger = new Logger(CreateTemplateUseCase.name);

  // TODO: In the future, templates should be stored in the database
  // For now, we'll store them in memory for demonstration
  private readonly customTemplates: Map<string, TemplateResponseDto> = new Map();

  async execute(
    dto: CreateTemplateRequestDto,
    currentUser: CurrentUserInterface,
  ): Promise<TemplateResponseDto> {
    const template: TemplateResponseDto = {
      id: uuidv4(),
      name: dto.name,
      description: dto.description,
      type: TemplateType.CUSTOM,
      configuration: dto.configuration,
      createdAt: new Date(),
      createdBy: currentUser.email,
    };

    // TODO: Save to database
    this.customTemplates.set(template.id, template);

    this.logger.log(
      `Created custom template '${template.name}' by user ${currentUser.email}`,
    );

    return template;
  }
}