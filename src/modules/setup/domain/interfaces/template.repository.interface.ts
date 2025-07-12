import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';
import { Template } from '../entities/template.entity';

export interface TemplateRepositoryInterface
  extends GenericRepositoryInterface<Template> {
  findByType(type: string): Promise<Template[]>;
  findByCreatedBy(createdBy: string): Promise<Template[]>;
}
