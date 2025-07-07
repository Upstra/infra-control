import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActiveUserInterceptor } from '../interceptors/active-user.interceptor';

export const ActiveUserInterceptorProvider = {
  provide: APP_INTERCEPTOR,
  useClass: ActiveUserInterceptor,
};
