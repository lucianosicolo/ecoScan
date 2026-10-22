import {
  Component,
} from '@angular/core';

import {
  Router,
} from '@angular/router';

import {
  AlertController,
  MenuController,
} from '@ionic/angular';

import {
  AuthService,
} from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: [
    'app.component.scss',
  ],
  standalone: false,
})
export class AppComponent {

  constructor(
    private readonly router:
      Router,

    private readonly menuController:
      MenuController,

    private readonly alertController:
      AlertController,

    private readonly authService:
      AuthService,
  ) {}

  get menuUserName():
    string {

    const user =
      this.authService.getUser();

    if (!user) {
      return 'Usuario';
    }

    return (
      `${user.nombre} ${user.apellido}`
        .trim()
    );
  }

  get menuUserInitials():
    string {

    const user =
      this.authService.getUser();

    if (!user) {
      return 'ES';
    }

    return (
      `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`
        .toUpperCase()
    );
  }

  get menuUserSubtitle():
    string {

    const user =
      this.authService.getUser();

    if (
      user?.ciudad
        ?.trim()
    ) {
      return user.ciudad;
    }

    return 'Cuenta EcoScan';
  }

  async navigateTo(
    route: string,
  ): Promise<void> {

    await this.menuController
      .close();

    await this.router
      .navigateByUrl(
        route,
      );
  }

  async openHelp():
    Promise<void> {

    await this.menuController
      .close();

    const alert =
      await this.alertController
        .create({
          header:
            'Cómo funciona EcoScan',

          message: `
            Sacá o elegí una foto de un residuo.
            EcoScan analizará su categoría,
            material y estado, y te indicará
            cómo prepararlo antes de reciclarlo.
          `,

          buttons: [
            'Entendido',
          ],
        });

    await alert.present();
  }

  async openAbout():
    Promise<void> {

    await this.menuController
      .close();

    const alert =
      await this.alertController
        .create({
          header:
            'Acerca de EcoScan',

          message: `
            EcoScan es una prueba de concepto
            para identificar botellas plásticas,
            latas, vidrio, papel y cartón mediante
            inteligencia artificial.
            <br><br>
            Versión 1.0.0
          `,

          buttons: [
            'Aceptar',
          ],
        });

    await alert.present();
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
                void this.performLogout();
              },
            },
          ],
        });

    await alert.present();
  }

  private async performLogout():
    Promise<void> {

    this.authService
      .logout();

    await this.menuController
      .close();

    await this.router
      .navigateByUrl(
        '/login',
        {
          replaceUrl: true,
        },
      );
  }
}
