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

    if (user && user.active === false) {
      throw new InactiveUserException();
    }

    return next.handle();
  }
}