import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionInitProvider } from '../encryption-init.provider';
import { EncryptionService } from '../encryption.service';
import * as encryptionTransformer from '../../../transformers/encryption.transformer';

jest.mock('../../../transformers/encryption.transformer', () => ({
  setEncryptionService: jest.fn(),
}));

describe('EncryptionInitProvider', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    jest.clearAllMocks();
    encryptionService = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    } as any;
  });

  it('should be defined as a provider with correct structure', () => {
    expect(EncryptionInitProvider).toBeDefined();
    expect(EncryptionInitProvider.provide).toBe('ENCRYPTION_INIT');
    expect(EncryptionInitProvider.useFactory).toBeDefined();
    expect(EncryptionInitProvider.inject).toEqual([EncryptionService]);
  });

  it('should call setEncryptionService with the encryption service instance', () => {
    const factory = EncryptionInitProvider.useFactory as Function;
    const result = factory(encryptionService);

    expect(encryptionTransformer.setEncryptionService).toHaveBeenCalledWith(encryptionService);
    expect(encryptionTransformer.setEncryptionService).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('should return true after initialization', () => {
    const factory = EncryptionInitProvider.useFactory as Function;
    const result = factory(encryptionService);

    expect(result).toBe(true);
  });

  it('should work correctly when integrated with NestJS module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: EncryptionService,
          useValue: encryptionService,
        },
        EncryptionInitProvider,
      ],
    }).compile();

    const initToken = module.get<boolean>('ENCRYPTION_INIT');
    
    expect(initToken).toBe(true);
    expect(encryptionTransformer.setEncryptionService).toHaveBeenCalledWith(encryptionService);
  });

  it('should handle factory execution multiple times', () => {
    const factory = EncryptionInitProvider.useFactory as Function;
    
    factory(encryptionService);
    factory(encryptionService);
    factory(encryptionService);

    expect(encryptionTransformer.setEncryptionService).toHaveBeenCalledTimes(3);
    expect(encryptionTransformer.setEncryptionService).toHaveBeenCalledWith(encryptionService);
  });
});