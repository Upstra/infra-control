import { Provider } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { setEncryptionService } from '../../transformers/encryption.transformer';

export const EncryptionInitProvider: Provider = {
  provide: 'ENCRYPTION_INIT',
  useFactory: (encryptionService: EncryptionService) => {
    setEncryptionService(encryptionService);
    return true;
  },
  inject: [EncryptionService],
};