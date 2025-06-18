import { SetupPhase } from '@/modules/setup/application/types';
import { SetupDomainService } from '../setup.domain.service';

describe('SetupDomainService', () => {
  let service: SetupDomainService;

  beforeEach(() => {
    service = new SetupDomainService();
  });

  describe('determineSetupState', () => {
    it('should return NOT_STARTED if there are no users and no servers', () => {
      const result = service.determineSetupState(0, 0, 0, 0);

      expect(result.phase).toBe(SetupPhase.NOT_STARTED);
      expect(result.hasAdminUser).toBe(false);
      expect(result.hasInfrastructure).toBe(false);
      expect(result.nextRequiredStep).toBe('welcome');
    });

    it('should return IN_PROGRESS with next step create-room if 1 user and no room', () => {
      const result = service.determineSetupState(1, 0, 0, 0);

      expect(result.phase).toBe(SetupPhase.IN_PROGRESS);
      expect(result.hasAdminUser).toBe(true);
      expect(result.hasInfrastructure).toBe(false);
      expect(result.nextRequiredStep).toBe('create-room');
    });

    it('should return COMPLETED if at least one server is present', () => {
      const result = service.determineSetupState(3, 2, 2, 1, true);

      expect(result.phase).toBe(SetupPhase.COMPLETED);
      expect(result.hasAdminUser).toBe(true);
      expect(result.hasInfrastructure).toBe(true);
      expect(result.nextRequiredStep).toBe(null);
    });

    it('should return IN_PROGRESS with next step create-server if room and ups are present but no server', () => {
      const result = service.determineSetupState(2, 1, 1, 0);

      expect(result.phase).toBe(SetupPhase.IN_PROGRESS);
      expect(result.nextRequiredStep).toBe('create-server');
    });

    it('should return IN_PROGRESS with next step create-ups if room exists but no UPS and no server', () => {
      const result = service.determineSetupState(1, 1, 0, 0);

      expect(result.phase).toBe(SetupPhase.IN_PROGRESS);
      expect(result.hasAdminUser).toBe(true);
      expect(result.hasInfrastructure).toBe(false);
      expect(result.nextRequiredStep).toBe('create-ups');
    });

    it('should return null when all conditions are met', () => {
      const step = service['determineNextStep'](1, 1, 1, 1, true);
      expect(step).toBeNull();
    });
  });

  describe('canUserPerformSetup', () => {
    it('should return false if user is not admin', () => {
      expect(service.canUserPerformSetup(false, SetupPhase.NOT_STARTED)).toBe(
        false,
      );
    });

    it('should return false if setup is already completed', () => {
      expect(service.canUserPerformSetup(true, SetupPhase.COMPLETED)).toBe(
        false,
      );
    });

    it('should return true if user is admin and setup is not completed', () => {
      expect(service.canUserPerformSetup(true, SetupPhase.IN_PROGRESS)).toBe(
        true,
      );
    });
  });

  describe('isFirstTimeSetup', () => {
    it('should return true for 0 users and 0 servers', () => {
      expect(service.isFirstTimeSetup(0, 0)).toBe(true);
    });

    it('should return true for 1 user and 0 servers', () => {
      expect(service.isFirstTimeSetup(1, 0)).toBe(true);
    });

    it('should return false if server exists', () => {
      expect(service.isFirstTimeSetup(1, 1)).toBe(false);
    });

    it('should return false if more than 1 user even without server', () => {
      expect(service.isFirstTimeSetup(2, 0)).toBe(false);
    });
  });
});
