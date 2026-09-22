import {
  Component,
  OnInit,
} from '@angular/core';

import {
  Router,
} from '@angular/router';

import {
  ToastController,
} from '@ionic/angular';

import {
  firstValueFrom,
} from 'rxjs';

import {
  AuthService,
} from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: [
    './login.page.scss',
  ],
  standalone: false,
})
export class LoginPage
  implements OnInit {

  email = '';
  password = '';

  rememberMe = false;
  showPassword = false;
  formSubmitted = false;
  loading = false;

  constructor(
    private readonly router:
      Router,

    private readonly toastController:
      ToastController,

    private readonly authService:
      AuthService,
  ) {}

  ngOnInit(): void {
    const savedEmail =
      localStorage.getItem(
        'ecoScan-email',
      );

    if (savedEmail) {
      this.email =
        savedEmail;

      this.rememberMe =
        true;
    }
  }

  togglePassword(): void {
    this.showPassword =
      !this.showPassword;
  }

  async login():
    Promise<void> {

    this.formSubmitted =
      true;

    const email =
      this.email
        .trim()
        .toLowerCase();

    if (
      !email ||
      !this.password ||
      this.password.length < 6
    ) {
      await this.showToast(
        'Completá correctamente el correo y la contraseña.',
        'danger',
      );

      return;
    }

    this.loading = true;

    try {
      const response =
        await firstValueFrom(
          this.authService.login(
            email,
            this.password,
          ),
        );

      this.authService
        .saveSession(
          response,
        );

      if (
        this.rememberMe
      ) {
        localStorage.setItem(
          'ecoScan-email',
          email,
        );
      } else {
        localStorage.removeItem(
          'ecoScan-email',
        );
      }

      await this.router
        .navigateByUrl(
          '/app/home',
          {
            replaceUrl: true,
          },
        );

    } catch (
      error: unknown
    ) {
      console.error(
        'Error iniciando sesión:',
        error,
      );

      await this.showToast(
        this.getErrorMessage(
          error,
        ),
        'danger',
      );

    } finally {
      this.loading = false;
    }
  }

  async forgotPassword():
    Promise<void> {

    await this.showToast(
      'La recuperación de contraseña estará disponible próximamente.',
      'medium',
    );
  }

  private getErrorMessage(
    error: unknown,
  ): string {

    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error
    ) {
      const httpError =
        error as {
          status?: number;
          error?: {
            message?:
              string |
              string[];
          };
        };

      if (
        httpError.status === 0
      ) {
        return (
          'No se pudo conectar con el servidor.'
        );
      }

      if (
        httpError.status === 401
      ) {
        return (
          'Correo o contraseña incorrectos.'
        );
      }

      const backendMessage =
        httpError.error
          ?.message;

      if (
        Array.isArray(
          backendMessage,
        )
      ) {
        return backendMessage
          .join('. ');
      }

      if (
        typeof backendMessage ===
        'string'
      ) {
        return backendMessage;
      }
    }

    return (
      'No se pudo iniciar sesión.'
    );
  }

  private async showToast(
    message: string,
    color: string,
  ): Promise<void> {

    const toast =
      await this.toastController
        .create({
          message,
          duration: 2200,
          position: 'bottom',
          color,
        });

    await toast.present();
  }
}