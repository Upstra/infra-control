import { CompleteSetupStepUseCase } from './complete-setup-step.use-case';
import { GetSetupStatusUseCase } from './get-setup-status.use-case';
import { CompleteVmDiscoveryUseCase } from './complete-vm-discovery.use-case';

export const SetupUseCases = [
  GetSetupStatusUseCase,
  CompleteSetupStepUseCase,
  CompleteVmDiscoveryUseCase,
];

export {
  GetSetupStatusUseCase,
  CompleteSetupStepUseCase,
  CompleteVmDiscoveryUseCase,
};
