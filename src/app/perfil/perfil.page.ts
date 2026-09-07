import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  ToastController
} from '@ionic/angular';

interface UserProfile {
  name: string;
  email: string;
  city: string;
  memberSince: string;
  photo: string | null;
  totalScans: number;
  suitableWaste: number;
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false
})
export class PerfilPage {

  user: UserProfile = {
    name: 'Luciano Sicolo',
    email: 'lucianosicolo@email.com',
    city: 'Cipolletti, Río Negro',
    memberSince: 'Septiembre de 2026',
    photo: null,
    totalScans: 12,
    suitableWaste: 9
  };

  editableUser: UserProfile = { ...this.user };

  editing = false;
  saving = false;
  notificationsEnabled = true;

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private readonly router: Router,
  ) { }
  get suitablePercentage(): number {
    if (this.user.totalScans === 0) {
      return 0;
    }

    return Math.round(
      (this.user.suitableWaste / this.user.totalScans) * 100,
    );
  }
  get recyclingPercentage(): number {
    if (!this.user.totalScans) {
      return 0;
    }

    return Math.round(
      (this.user.suitableWaste / this.user.totalScans) * 100
    );
  }

  get ecoLevel(): string {
    if (this.user.totalScans >= 50) {
      return 'Guardián del planeta';
    }

    if (this.user.totalScans >= 20) {
      return 'Reciclador consciente';
    }

    return 'Explorador ecológico';
  }

  get levelProgress(): number {
    if (this.user.totalScans >= 50) {
      return 100;
    }

    if (this.user.totalScans >= 20) {
      return Math.round(
        ((this.user.totalScans - 20) / 30) * 100
      );
    }

    return Math.round(
      (this.user.totalScans / 20) * 100
    );
  }

  get scansToNextLevel(): number {
    if (this.user.totalScans >= 50) {
      return 0;
    }

    if (this.user.totalScans >= 20) {
      return 50 - this.user.totalScans;
    }

    return 20 - this.user.totalScans;
  }

  getInitials(): string {
    return this.user.name
      .split(' ')
      .filter(part => part.length > 0)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  toggleEdit(): void {
    if (this.editing) {
      this.editableUser = { ...this.user };
    }

    this.editing = !this.editing;
  }

  async saveProfile(): Promise<void> {
    const name = this.editableUser.name.trim();
    const email = this.editableUser.email.trim();
    const city = this.editableUser.city.trim();
    const validEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !email || !city) {
      await this.showToast(
        'Completá todos los campos.',
        'danger',
      );

      return;
    }

    if (!validEmail) {
      await this.showToast(
        'Ingresá un correo electrónico válido.',
        'danger',
      );

      return;
    }
    if (!name || !email || !city) {
      const toast = await this.toastController.create({
        message: 'Completá todos los campos.',
        duration: 2000,
        color: 'danger',
        position: 'bottom'
      });

      await toast.present();
      return;
    }

    this.saving = true;

    // Más adelante se reemplaza con la llamada al backend.
    setTimeout(async () => {
      this.user = {
        ...this.editableUser,
        name,
        email,
        city
      };

      this.editableUser = { ...this.user };
      this.saving = false;
      this.editing = false;

      const toast = await this.toastController.create({
        message: 'Perfil actualizado correctamente.',
        duration: 1800,
        color: 'success',
        position: 'bottom'
      });

      await toast.present();
    }, 700);
  }

  changeProfilePhoto(): void {
    console.log('Seleccionar nueva foto de perfil');
  }
  private async showToast(
    message: string,
    color: string,
  ): Promise<void> {
    const toast =
      await this.toastController.create({
        message,
        duration: 2000,
        color,
        position: 'bottom',
      });

    await toast.present();
  }
  openHelp(): void {
    console.log('Abrir ayuda');
  }
  ngOnInit(): void {
    const savedPreference =
      localStorage.getItem(
        'ecoscan-notifications',
      );

    if (savedPreference !== null) {
      this.notificationsEnabled =
        savedPreference === 'true';
    }
  }
  saveNotificationPreference(): void {
    localStorage.setItem(
      'ecoscan-notifications',
      String(this.notificationsEnabled),
    );
  }
  openAbout(): void {
    console.log('Abrir información de EcoScan');
  }

  async logout(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Cerrar sesión',
      message: '¿Seguro que querés salir de tu cuenta?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: () => {
            localStorage.removeItem('ecoScan-session');

            void this.router.navigateByUrl(
              '/login',
              {
                replaceUrl: true,
              },
            );
          },
        }
      ]
    });

    await alert.present();
  }
}