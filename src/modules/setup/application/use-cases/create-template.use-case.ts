import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  CreateTemplateRequestDto,
  TemplateResponseDto,
  TemplateType,
} from '../dto';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { RedisSafeService } from '../../../redis/application/services/redis-safe.service';

@Injectable()
export class CreateTemplateUseCase {
  private readonly logger = new Logger(CreateTemplateUseCase.name);
  private readonly REDIS_KEY = 'setup:custom_templates';

  constructor(private readonly redisService: RedisSafeService) {}

  async execute(
    dto: CreateTemplateRequestDto,
    currentUser: JwtPayload,
  ): Promise<TemplateResponseDto> {
    const template: TemplateResponseDto = {
      id: `custom-${Date.now()}-${randomBytes(6).toString('hex')}`,
      name: dto.name,
      description: dto.description,
      type: TemplateType.CUSTOM,
      configuration: dto.configuration,
      createdAt: new Date(),
      createdBy: currentUser.email,
    };

    const existingTemplatesJson = await this.redisService.safeGet(
      this.REDIS_KEY,
    );
    const existingTemplates: TemplateResponseDto[] = existingTemplatesJson
      ? JSON.parse(existingTemplatesJson)
      : [];

    existingTemplates.push(template);
    await this.redisService.safeSet(
      this.REDIS_KEY,
      JSON.stringify(existingTemplates),
    );

    this.logger.log(
      `Created custom template '${template.name}' by user ${currentUser.email}`,
    );

    return template;
  }
}
