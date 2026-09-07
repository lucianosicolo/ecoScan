import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;
  formSubmitted = false;
  loading = false;
  goToRegister(): void {
  }
  constructor(
    private router: Router,
    private toastController: ToastController
  ) { }
  ngOnInit(): void {
    const savedEmail = localStorage.getItem('ecoScan-email');

    if (savedEmail) {
      this.email = savedEmail;
      this.rememberMe = true;
    }
  }
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
  async login(): Promise<void> {
    this.formSubmitted = true;

    // Validación básica
    if (!this.email || !this.password || this.password.length < 6) {
      await this.showToast(
        'Completá correctamente el correo y la contraseña.',
        'danger'
      );

      return;
    }
    this.loading = true;
   const email =
  this.email.trim().toLowerCase();

const validEmail = 'admin@ecoscan.com';
const validPassword = '123456';

setTimeout(async () => {
  if (
    email === validEmail &&
    this.password === validPassword
  ) {
    if (this.rememberMe) {
      localStorage.setItem(
        'ecoScan-email',
        email,
      );
    } else {
      localStorage.removeItem(
        'ecoScan-email',
      );
    }

    localStorage.setItem(
      'ecoScan-session',
      'true',
    );

    await this.router.navigateByUrl(
      '/app/home',
      {
        replaceUrl: true,
      },
    );
  } else {
    await this.showToast(
      'Correo o contraseña incorrectos.',
      'danger',
    );
  }

  this.loading = false;
}, 700);
  }

  async forgotPassword(): Promise<void> {
    await this.showToast(
      'La recuperación de contraseña estará disponible próximamente.',
      'medium'
    );
  }

  private async showToast(
    message: string,
    color: string
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'bottom',
      color
    });

    await toast.present();
  }
}