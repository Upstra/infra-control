import { validate } from 'class-validator';
import { CompleteSetupStepDto } from '../complete-setup-step.dto';
import { SetupStep } from '../setup-status.dto';

describe('CompleteSetupStepDto', () => {
  const buildDto = (
    partial: Partial<CompleteSetupStepDto> = {},
  ): CompleteSetupStepDto => {
    return Object.assign(new CompleteSetupStepDto(), {
      step: SetupStep.WELCOME,
      metadata: { note: 'ok' },
      ...partial,
    });
  };

  it('validates a correct dto', async () => {
    const dto = buildDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when step is invalid', async () => {
    const dto = buildDto({ step: 'wrong-step' as any });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('step');
  });

  it('allows metadata to be omitted', async () => {
    const dto = buildDto({ metadata: undefined });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
