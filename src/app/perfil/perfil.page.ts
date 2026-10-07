import {
  Component,
  OnInit,
} from '@angular/core';

import {
  Router,
} from '@angular/router';

import {
  AlertController,
  ToastController,
} from '@ionic/angular';

import {
  HttpErrorResponse,
} from '@angular/common/http';

import {
  AuthService,
} from '../auth/auth.service';

import {
  HistorialService,
} from '../historial/historial.service';

import type {
  HistorialItem,
} from '../historial/historial.service';
import { User, UsersService } from './service/users.service';


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
  styleUrls: [
    './perfil.page.scss',
  ],
  standalone: false,
})
export class PerfilPage
  implements OnInit {

  user: UserProfile = {
    name: '',
    email: '',
    city: '',
    memberSince: '',
    photo: null,
    totalScans: 0,
    suitableWaste: 0,
  };

  editableUser:
    UserProfile = {
      ...this.user,
    };

  editing = false;
  saving = false;
  helpOpen = false;
  aboutOpen = false;
  ecoPoints = 0;
  constructor(
    private readonly alertController:
      AlertController,

    private readonly toastController:
      ToastController,

    private readonly router:
      Router,

    private readonly authService:
      AuthService,

    private readonly historialService:
      HistorialService,

    private readonly usersService:
      UsersService,
  ) { }

  ngOnInit(): void {
    this.loadUser();
    this.loadActivity();
  }

  private loadUser(): void {

    const authUser =
      this.authService.getUser();

    if (!authUser) {
      void this.router.navigateByUrl(
        '/login',
        {
          replaceUrl: true,
        },
      );

      return;
    }

    this.user = {
      ...this.user,

      name:
        `${authUser.nombre} ${authUser.apellido}`
          .trim(),

      email:
        authUser.email,

      city:
        authUser.ciudad ?? '',

      memberSince:
        this.formatMemberSince(
          authUser.createdAt,
        ),
    };

    this.editableUser = {
      ...this.user,
    };
  }

  private loadActivity(): void {

    this.historialService
      .findAll()
      .subscribe({
        next: (
          history:
            HistorialItem[],
        ) => {

          this.user.totalScans =
            history.length;

          this.user.suitableWaste =
  history.filter(
    (item) =>
      item.estado === 'apto',
  ).length;

this.ecoPoints =
  this.user.suitableWaste * 10;
          this.editableUser = {
            ...this.user,
          };
        },

        error: (
          error: HttpErrorResponse,
        ) => {

          console.error(
            'Error cargando actividad:',
            error,
          );
        },
      });
  }

  get recyclingPercentage():
    number {

    if (
      this.user.totalScans === 0
    ) {
      return 0;
    }

    return Math.round(
      (
        this.user.suitableWaste /
        this.user.totalScans
      ) * 100,
    );
  }

  get ecoLevel(): number {

    if (this.ecoPoints >= 200) {
      return 5;
    }

    if (this.ecoPoints >= 120) {
      return 4;
    }

    if (this.ecoPoints >= 80) {
      return 3;
    }

    if (this.ecoPoints >= 30) {
      return 2;
    }

    return 1;
  }


  get ecoLevelName(): string {

    const levels:
      Record<number, string> = {

      1: 'Semilla',
      2: 'EcoAprendiz',
      3: 'EcoExplorador',
      4: 'Guardián Verde',
      5: 'EcoMaster',
    };

    return levels[
      this.ecoLevel
    ];
  }


  get nextEcoLevelName():
    string | null {

    const levels = [
      {
        points: 30,
        name: 'EcoAprendiz',
      },
      {
        points: 80,
        name: 'EcoExplorador',
      },
      {
        points: 120,
        name: 'Guardián Verde',
      },
      {
        points: 200,
        name: 'EcoMaster',
      },
    ];

    return (
      levels.find(
        level =>
          level.points >
          this.ecoPoints,
      )?.name ?? null
    );
  }


  get pointsToNextLevel():
    number {

    if (this.ecoPoints >= 200) {
      return 0;
    }

    if (this.ecoPoints >= 120) {
      return 200 - this.ecoPoints;
    }

    if (this.ecoPoints >= 80) {
      return 120 - this.ecoPoints;
    }

    if (this.ecoPoints >= 30) {
      return 80 - this.ecoPoints;
    }

    return 30 - this.ecoPoints;
  }


  get levelProgress():
    number {

    if (this.ecoPoints >= 200) {
      return 100;
    }

    let previous = 0;
    let next = 30;

    if (this.ecoPoints >= 120) {
      previous = 120;
      next = 200;
    } else if (
      this.ecoPoints >= 80
    ) {
      previous = 80;
      next = 120;
    } else if (
      this.ecoPoints >= 30
    ) {
      previous = 30;
      next = 80;
    }

    return Math.round(
      (
        (
          this.ecoPoints -
          previous
        ) /
        (
          next -
          previous
        )
      ) * 100,
    );
  }
  getInitials(): string {

    return this.user.name
      .split(' ')
      .filter(
        part =>
          part.length > 0,
      )
      .slice(
        0,
        2,
      )
      .map(
        part =>
          part
            .charAt(0)
            .toUpperCase(),
      )
      .join('');
  }

  toggleEdit(): void {

    if (this.editing) {
      this.editableUser = {
        ...this.user,
      };
    }

    this.editing =
      !this.editing;
  }

  async saveProfile():
    Promise<void> {

    const authUser =
      this.authService.getUser();

    if (!authUser) {
      await this.showToast(
        'No se encontró el usuario.',
        'danger',
      );

      return;
    }

    const fullName =
      this.editableUser.name
        .trim();

    const nameParts =
      fullName
        .split(' ')
        .filter(
          part =>
            part.length > 0,
        );

    if (
      nameParts.length < 2
    ) {
      await this.showToast(
        'Ingresá nombre y apellido.',
        'danger',
      );

      return;
    }

    const nombre =
      nameParts[0];

    const apellido =
      nameParts
        .slice(1)
        .join(' ');

    const email =
      this.editableUser.email
        .trim()
        .toLowerCase();

    const ciudad =
      this.editableUser.city
        .trim();

    const validEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

    if (!validEmail) {
      await this.showToast(
        'Ingresá un correo electrónico válido.',
        'danger',
      );

      return;
    }

    this.saving = true;

    this.usersService
      .update(
        authUser.id,
        {
          nombre,
          apellido,
          email,
          ciudad,
        },
      )
      .subscribe({
        next: async (
          updatedUser:
            User,
        ) => {

          localStorage.setItem(
            'ecoScan-user',
            JSON.stringify(
              updatedUser,
            ),
          );

          this.user = {
            ...this.user,

            name:
              `${updatedUser.nombre} ${updatedUser.apellido}`
                .trim(),

            email:
              updatedUser.email,

            city:
              updatedUser.ciudad ?? '',
          };

          this.editableUser = {
            ...this.user,
          };

          this.editing = false;
          this.saving = false;

          await this.showToast(
            'Perfil actualizado correctamente.',
            'success',
          );
        },

        error: async (
          error:
            HttpErrorResponse,
        ) => {

          console.error(
            'Error actualizando perfil:',
            error,
          );

          this.saving = false;

          const message =
            error.error?.message ??
            'No se pudo actualizar el perfil.';

          await this.showToast(
            Array.isArray(message)
              ? message.join('. ')
              : String(message),
            'danger',
          );
        },
      });
  }



  private formatMemberSince(
    createdAt: string,
  ): string {

    if (!createdAt) {
      return 'Sin información';
    }

    const date =
      new Date(
        createdAt,
      );

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return 'Sin información';
    }

    return new Intl.DateTimeFormat(
      'es-AR',
      {
        month: 'long',
        year: 'numeric',
      },
    ).format(
      date,
    );
  }


  openHelp(): void {
    this.helpOpen = true;
  }

  closeHelp(): void {
    this.helpOpen = false;
  }

  openAbout(): void {
    this.aboutOpen = true;
  }

  closeAbout(): void {
    this.aboutOpen = false;
  }

  async logout():
    Promise<void> {

    const alert =
      await this.alertController
        .create({
          header:
            'Cerrar sesión',

          message:
            '¿Seguro que querés salir de tu cuenta?',

          buttons: [
            {
              text:
                'Cancelar',

              role:
                'cancel',
            },

            {
              text:
                'Cerrar sesión',

              role:
                'destructive',

              handler: () => {

                this.authService
                  .logout();

                void this.router
                  .navigateByUrl(
                    '/login',
                    {
                      replaceUrl:
                        true,
                    },
                  );
              },
            },
          ],
        });

    await alert.present();
  }

  private async showToast(
    message: string,
    color: string,
  ): Promise<void> {

    const toast =
      await this.toastController
        .create({
          message,
          duration: 2000,
          color,
          position:
            'bottom',
        });

    await toast.present();
  }
}