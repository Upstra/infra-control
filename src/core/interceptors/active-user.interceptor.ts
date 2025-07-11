import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { InactiveUserException } from '../exceptions/inactive-user.exception';

@Injectable()
export class ActiveUserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log('ActiveUserInterceptor: Checking user status', user);

    if (user && user.isActive !== true) {
      throw new InactiveUserException();
    }

    return next.handle();
  }
}
