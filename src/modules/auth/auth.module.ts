import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './application/controllers/auth.controller';
import { UserModule } from '../users/user.module';
import { PassportModule } from '@nestjs/passport';
import { TwoFAController } from './application/controllers/twofa.controller';
import { RecoveryCodeService } from './domain/services/recovery-code.domain.service';
import { AuthUseCases } from './application/use-cases';
import { TokenService } from './application/services/token.service';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [
    UserModule,
    PassportModule,
    AuditModule,
    EmailModule,
    HistoryModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION'),
        },
      }),
    }),
  ],
  controllers: [AuthController, TwoFAController],
  providers: [JwtStrategy, RecoveryCodeService, TokenService, ...AuthUseCases],
  exports: [JwtModule],
})
export class AuthModule {}
