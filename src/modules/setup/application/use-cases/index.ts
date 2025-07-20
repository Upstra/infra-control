import { CompleteSetupStepUseCase } from './complete-setup-step.use-case';
import { GetSetupStatusUseCase } from './get-setup-status.use-case';
import { CompleteVmDiscoveryUseCase } from './complete-vm-discovery.use-case';
import { GetSetupProgressUseCase } from './get-setup-progress.use-case';
import { BulkCreateUseCase } from './bulk-create.use-case';
import { BulkCreateWithDiscoveryUseCase } from './bulk-create-with-discovery.use-case';
import { BulkValidationUseCase } from './bulk-validation.use-case';
import { GetTemplatesUseCase } from './get-templates.use-case';
import { CreateTemplateUseCase } from './create-template.use-case';
import { GetSetupProgressEnhancedUseCase } from './get-setup-progress-enhanced.use-case';
import { ValidateIpUseCase } from './validate-ip.use-case';
import { ValidateNameUseCase } from './validate-name.use-case';

export const SetupUseCases = [
  GetSetupStatusUseCase,
  GetSetupProgressUseCase,
  CompleteSetupStepUseCase,
  CompleteVmDiscoveryUseCase,
  BulkCreateUseCase,
  BulkCreateWithDiscoveryUseCase,
  BulkValidationUseCase,
  GetTemplatesUseCase,
  CreateTemplateUseCase,
  GetSetupProgressEnhancedUseCase,
  ValidateIpUseCase,
  ValidateNameUseCase,
];

export {
  GetSetupStatusUseCase,
  GetSetupProgressUseCase,
  CompleteSetupStepUseCase,
  CompleteVmDiscoveryUseCase,
  BulkCreateUseCase,
  BulkCreateWithDiscoveryUseCase,
  BulkValidationUseCase,
  GetTemplatesUseCase,
  CreateTemplateUseCase,
  GetSetupProgressEnhancedUseCase,
  ValidateIpUseCase,
  ValidateNameUseCase,
};
