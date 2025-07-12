import { CompleteSetupStepUseCase } from './complete-setup-step.use-case';
import { GetSetupStatusUseCase } from './get-setup-status.use-case';
import { CompleteVmDiscoveryUseCase } from './complete-vm-discovery.use-case';
import { GetSetupProgressUseCase } from './get-setup-progress.use-case';
import { BulkCreateUseCase } from './bulk-create.use-case';
import { BulkValidationUseCase } from './bulk-validation.use-case';
import { GetTemplatesUseCase } from './get-templates.use-case';
import { CreateTemplateUseCase } from './create-template.use-case';
import { GetSetupProgressEnhancedUseCase } from './get-setup-progress-enhanced.use-case';

export const SetupUseCases = [
  GetSetupStatusUseCase,
  GetSetupProgressUseCase,
  CompleteSetupStepUseCase,
  CompleteVmDiscoveryUseCase,
  BulkCreateUseCase,
  BulkValidationUseCase,
  GetTemplatesUseCase,
  CreateTemplateUseCase,
  GetSetupProgressEnhancedUseCase,
];

export {
  GetSetupStatusUseCase,
  GetSetupProgressUseCase,
  CompleteSetupStepUseCase,
  CompleteVmDiscoveryUseCase,
  BulkCreateUseCase,
  BulkValidationUseCase,
  GetTemplatesUseCase,
  CreateTemplateUseCase,
  GetSetupProgressEnhancedUseCase,
};
