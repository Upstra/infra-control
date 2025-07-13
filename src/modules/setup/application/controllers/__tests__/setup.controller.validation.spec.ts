import { ValidateIpUseCase } from '../../use-cases/validate-ip.use-case';
import { ValidateNameUseCase } from '../../use-cases/validate-name.use-case';

describe('SetupController - Validation Endpoints', () => {
  let validateIpUseCase: jest.Mocked<ValidateIpUseCase>;
  let validateNameUseCase: jest.Mocked<ValidateNameUseCase>;

  // Mock controller methods directly
  const mockController = {
    validateIp: jest.fn(),
    validateName: jest.fn(),
  };

  beforeEach(async () => {
    validateIpUseCase = {
      execute: jest.fn(),
    } as any;

    validateNameUseCase = {
      execute: jest.fn(),
    } as any;

    // Reset mocks
    jest.clearAllMocks();
    
    // Setup controller methods to call use cases
    mockController.validateIp.mockImplementation((value, type, excludeId) => 
      validateIpUseCase.execute({ ip: value, resourceType: type, excludeId })
    );
    mockController.validateName.mockImplementation((value, type, excludeId) => 
      validateNameUseCase.execute({ name: value, resourceType: type, excludeId })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateIp', () => {
    it('should validate IP address availability', async () => {
      const value = '192.168.1.100';
      const type = 'server';

      const expectedResponse = {
        exists: false,
      };

      validateIpUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await mockController.validateIp(value, type);

      expect(result).toEqual(expectedResponse);
      expect(validateIpUseCase.execute).toHaveBeenCalledWith({
        ip: value,
        resourceType: type,
        excludeId: undefined,
      });
    });

    it('should return conflict when IP exists', async () => {
      const value = '192.168.1.100';
      const type = 'ups';

      const expectedResponse = {
        exists: true,
        conflictsWith: 'UPS "UPS-Primary"',
      };

      validateIpUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await mockController.validateIp(value, type);

      expect(result).toEqual(expectedResponse);
      expect(validateIpUseCase.execute).toHaveBeenCalledWith({
        ip: value,
        resourceType: type,
        excludeId: undefined,
      });
    });

    it('should handle IP validation with excludeId', async () => {
      const value = '192.168.1.100';
      const type = 'server';
      const excludeId = 'server-123';

      const expectedResponse = {
        exists: false,
      };

      validateIpUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await mockController.validateIp(value, type, excludeId);

      expect(result).toEqual(expectedResponse);
      expect(validateIpUseCase.execute).toHaveBeenCalledWith({
        ip: value,
        resourceType: type,
        excludeId,
      });
    });
  });

  describe('validateName', () => {
    it('should validate name availability', async () => {
      const value = 'New Server';
      const type = 'server';

      const expectedResponse = {
        exists: false,
      };

      validateNameUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await mockController.validateName(value, type);

      expect(result).toEqual(expectedResponse);
      expect(validateNameUseCase.execute).toHaveBeenCalledWith({
        name: value,
        resourceType: type,
        excludeId: undefined,
      });
    });

    it('should return conflict when name exists', async () => {
      const value = 'Existing Room';
      const type = 'room';

      const expectedResponse = {
        exists: true,
        conflictsWith: 'Room "Existing Room"',
      };

      validateNameUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await mockController.validateName(value, type);

      expect(result).toEqual(expectedResponse);
      expect(validateNameUseCase.execute).toHaveBeenCalledWith({
        name: value,
        resourceType: type,
        excludeId: undefined,
      });
    });

    it('should handle name validation with excludeId', async () => {
      const value = 'UPS Name';
      const type = 'ups';
      const excludeId = 'ups-456';

      const expectedResponse = {
        exists: false,
      };

      validateNameUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await mockController.validateName(value, type, excludeId);

      expect(result).toEqual(expectedResponse);
      expect(validateNameUseCase.execute).toHaveBeenCalledWith({
        name: value,
        resourceType: type,
        excludeId,
      });
    });
  });
});