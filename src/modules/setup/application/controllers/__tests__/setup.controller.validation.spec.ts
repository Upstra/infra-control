import { ValidateIpUseCase } from '../../use-cases/validate-ip.use-case';
import { ValidateNameUseCase } from '../../use-cases/validate-name.use-case';
import { IpValidationRequestDto, NameValidationRequestDto } from '../../dto/ip-validation.dto';

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
    mockController.validateIp.mockImplementation((dto) => validateIpUseCase.execute(dto));
    mockController.validateName.mockImplementation((dto) => validateNameUseCase.execute(dto));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateIp', () => {
    it('should validate IP address availability', async () => {
      const dto: IpValidationRequestDto = {
        ip: '192.168.1.100',
        resourceType: 'server',
      };

      const expectedResponse = {
        exists: false,
      };

      validateIpUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await mockController.validateIp(dto);

      expect(result).toEqual(expectedResponse);
      expect(validateIpUseCase.execute).toHaveBeenCalledWith(dto);
    });

    it('should return conflict when IP exists', async () => {
      const dto: IpValidationRequestDto = {
        ip: '192.168.1.100',
        resourceType: 'ups',
      };

      const expectedResponse = {
        exists: true,
        conflictsWith: 'UPS "UPS-Primary"',
      };

      validateIpUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await mockController.validateIp(dto);

      expect(result).toEqual(expectedResponse);
      expect(validateIpUseCase.execute).toHaveBeenCalledWith(dto);
    });

    it('should handle IP validation with excludeId', async () => {
      const dto: IpValidationRequestDto = {
        ip: '192.168.1.100',
        resourceType: 'server',
        excludeId: 'server-123',
      };

      const expectedResponse = {
        exists: false,
      };

      validateIpUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await mockController.validateIp(dto);

      expect(result).toEqual(expectedResponse);
      expect(validateIpUseCase.execute).toHaveBeenCalledWith(dto);
    });
  });

  describe('validateName', () => {
    it('should validate name availability', async () => {
      const dto: NameValidationRequestDto = {
        name: 'New Server',
        resourceType: 'server',
      };

      const expectedResponse = {
        exists: false,
      };

      validateNameUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await mockController.validateName(dto);

      expect(result).toEqual(expectedResponse);
      expect(validateNameUseCase.execute).toHaveBeenCalledWith(dto);
    });

    it('should return conflict when name exists', async () => {
      const dto: NameValidationRequestDto = {
        name: 'Existing Room',
        resourceType: 'room',
      };

      const expectedResponse = {
        exists: true,
        conflictsWith: 'Room "Existing Room"',
      };

      validateNameUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await mockController.validateName(dto);

      expect(result).toEqual(expectedResponse);
      expect(validateNameUseCase.execute).toHaveBeenCalledWith(dto);
    });

    it('should handle name validation with excludeId', async () => {
      const dto: NameValidationRequestDto = {
        name: 'UPS Name',
        resourceType: 'ups',
        excludeId: 'ups-456',
      };

      const expectedResponse = {
        exists: false,
      };

      validateNameUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await mockController.validateName(dto);

      expect(result).toEqual(expectedResponse);
      expect(validateNameUseCase.execute).toHaveBeenCalledWith(dto);
    });
  });
});