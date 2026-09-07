import { Component } from '@angular/core';
import { Router } from '@angular/router';

import {
  AlertController,
  ToastController,
} from '@ionic/angular';

import { firstValueFrom } from 'rxjs';

import {
  AuthService,
  RegisterRequest,
} from '../auth.service';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: false,
})
export class RegistroPage {
  form: RegisterForm = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  };

  loading = false;
  formSubmitted = false;

  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly toastController:
      ToastController,
    private readonly alertController:
      AlertController,
  ) {}

  get passwordsDoNotMatch(): boolean {
    return (
      this.form.confirmPassword.length > 0 &&
      this.form.password !==
        this.form.confirmPassword
    );
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword =
      !this.showConfirmPassword;
  }

  async register(): Promise<void> {
    this.formSubmitted = true;

    const name = this.form.name.trim();
    const email = this.form.email
      .trim()
      .toLowerCase();

    if (
      name.length < 3 ||
      !this.isValidEmail(email) ||
      this.form.password.length < 8 ||
      this.passwordsDoNotMatch ||
      !this.form.acceptedTerms
    ) {
      await this.showToast(
        'Revisá los campos marcados.',
        'danger',
      );

      return;
    }

    const request: RegisterRequest = {
      name,
      email,
      password: this.form.password,
    };

    this.loading = true;

    try {
      const response = await firstValueFrom(
        this.authService.register(request),
      );

      this.authService.saveSession(response);

      await this.showToast(
        'Tu cuenta fue creada correctamente.',
        'success',
      );

      await this.router.navigateByUrl(
        '/app/home',
        {
          replaceUrl: true,
        },
      );
    } catch (error: unknown) {
      const message =
        this.getErrorMessage(error);

      await this.showToast(
        message,
        'danger',
      );
    } finally {
      this.loading = false;
    }
  }

  async showTerms(): Promise<void> {
    const alert =
      await this.alertController.create({
        header: 'Términos y condiciones',
        message:
          'EcoScan utiliza los datos de tu cuenta ' +
          'para guardar tu actividad y progreso. ' +
          'Las imágenes enviadas se procesan para ' +
          'identificar residuos.',
        buttons: ['Entendido'],
      });

    await alert.present();
  }

  private isValidEmail(
    email: string,
  ): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
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
      const httpError = error as {
        status?: number;
        error?: {
          message?: string | string[];
        };
      };

      if (httpError.status === 0) {
        return (
          'No se pudo conectar con el servidor. ' +
          'Comprobá que el backend esté encendido.'
        );
      }

      if (httpError.status === 409) {
        return (
          'Ya existe una cuenta registrada ' +
          'con ese correo.'
        );
      }

      const backendMessage =
        httpError.error?.message;

      if (Array.isArray(backendMessage)) {
        return backendMessage.join('. ');
      }

      if (
        typeof backendMessage === 'string'
      ) {
        return backendMessage;
      }
    }

    return (
      'No se pudo crear la cuenta. ' +
      'Intentá nuevamente.'
    );
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger',
  ): Promise<void> {
    const toast =
      await this.toastController.create({
        message,
        duration: 2200,
        position: 'bottom',
        color,
      });

    await toast.present();
  }
}