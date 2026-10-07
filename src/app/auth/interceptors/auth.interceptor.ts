import {
  Injectable,
} from '@angular/core';

import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';

import {
  Router,
} from '@angular/router';

import {
  catchError,
  Observable,
  throwError,
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

    private readonly router:
      Router,
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

    return next
      .handle(
        authenticatedRequest,
      )
      .pipe(
        catchError(
          (
            error:
              HttpErrorResponse,
          ) => {

            if (
              error.status === 401
            ) {
              this.authService
                .logout();

              void this.router
                .navigateByUrl(
                  '/login',
                  {
                    replaceUrl: true,
                  },
                );
            }

            return throwError(
              () => error,
            );
          },
        ),
      );
  }
}