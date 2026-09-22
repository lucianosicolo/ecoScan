import {
  Injectable,
} from '@angular/core';

import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';

import {
  Observable,
} from 'rxjs';

import {
  AuthService,
} from '../auth.service';

@Injectable()
export class AuthInterceptor
  implements HttpInterceptor {

  constructor(
    private readonly authService:
      AuthService,
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {

    const token =
      this.authService.getToken();

    const isBackendRequest =
      request.url.startsWith(
        'http://localhost:3000',
      );

    if (
      !token ||
      !isBackendRequest
    ) {
      return next.handle(
        request,
      );
    }

    const authenticatedRequest =
      request.clone({
        setHeaders: {
          Authorization:
            `Bearer ${token}`,
        },
      });

    return next.handle(
      authenticatedRequest,
    );
  }
}