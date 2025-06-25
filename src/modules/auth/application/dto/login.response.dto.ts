export class LoginResponseDto {
  accessToken?: string;
  refreshToken?: string;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
}
