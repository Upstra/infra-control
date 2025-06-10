import { validate } from 'class-validator';
import { SetupStatusDto, SetupStep } from '../setup-status.dto';

describe('SetupStatusDto', () => {
  const buildDto = (partial: Partial<SetupStatusDto> = {}): SetupStatusDto => {
    return Object.assign(new SetupStatusDto(), {
      isFirstSetup: true,
      hasAdminUser: false,
      hasRooms: false,
      hasUps: false,
      hasServers: false,
      currentStep: SetupStep.CREATE_ROOM,
      ...partial,
    });
  };

  it('should validate a fully correct object', async () => {
    const dto = buildDto({
      isCurrentUserAdmin: true,
      totalSteps: 5,
      currentStepIndex: 1,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should allow optional fields to be omitted', async () => {
    const dto = buildDto(); // no optional fields set
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail if currentStep is not a valid enum', async () => {
    const dto = buildDto({ currentStep: 'invalid-step' as any });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('currentStep');
  });

  it('should fail if a boolean field is set to a string', async () => {
    const dto = buildDto({ isFirstSetup: 'true' as any });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('isFirstSetup');
  });

  it('should fail if optional number is invalid', async () => {
    const dto = buildDto({ totalSteps: 'five' as any });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('totalSteps');
  });
});
