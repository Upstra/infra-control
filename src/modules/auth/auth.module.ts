import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './infrastructure/controllers/auth.controller';
import { UserModule } from '../users/user.module';
import { PassportModule } from '@nestjs/passport';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { Get2FAStatusUseCase } from './application/use-cases/get-2fa-status.use-case';
import { Generate2FAUseCase } from './application/use-cases/generate-2fa.use-case';
import { Verify2FAUseCase } from './application/use-cases/verify-2fa.use-case';
import { Disable2FAUseCase } from './application/use-cases/disable-2fa.use-case';

@Module({
  imports: [
    UserModule,
    PassportModule,
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
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    LoginUseCase,
    RegisterUseCase,
    Get2FAStatusUseCase,
    Generate2FAUseCase,
    Verify2FAUseCase,
    Disable2FAUseCase,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
