import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from './encryption.service';
import { EncryptionInitProvider } from './encryption-init.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'EncryptionServiceInterface',
      useClass: EncryptionService,
    },
    EncryptionService,
    EncryptionInitProvider,
  ],
  exports: ['EncryptionServiceInterface', EncryptionService],
})
export class EncryptionModule {}