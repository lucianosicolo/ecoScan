import {
  Component,
  OnInit,
} from '@angular/core';

import {
  ScanUiService,
} from '../scan/services/scan-ui.service';

import {
  RecyclingStatus,
  WasteCategory,
} from '../scan/services/scan.service';

import {
  AuthService,
} from '../auth/auth.service';

import {
  HistorialItem,
  HistorialService,
} from '../historial/historial.service';


interface EcoUnlock {
  name: string;
  points: number;
  icon: string;
}


interface ScanResult {
  name: string;
  category: string;
  categoria: WasteCategory;
  confidence: number;
  recyclable: boolean;
  estado: RecyclingStatus;
  icon: string;
  imagenUrl: string | null;
}


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: [
    './home.page.scss',
  ],
  standalone: false,
})
export class HomePage
  implements OnInit {

  totalScans = 0;

  recyclableWaste = 0;

  suitableWaste = 0;

  ecoPoints = 0;

  loadingActivity = true;

  activityError = false;

  lastScan:
    ScanResult | null = null;

  userName = '';

  userInitials = '';


  readonly ecoUnlocks:
    EcoUnlock[] = [
      {
        name: 'Brote',
        points: 10,
        icon: 'leaf-outline',
      },
      {
        name: 'Árbol',
        points: 30,
        icon: 'leaf',
      },
      {
        name: 'Banco',
        points: 50,
        icon: 'remove-outline',
      },
      {
        name: 'Laguna',
        points: 80,
        icon: 'water-outline',
      },
      {
        name: 'Casita de aves',
        points: 120,
        icon: 'home-outline',
      },
      {
        name: 'Estación',
        points: 160,
        icon: 'trash-bin-outline',
      },
      {
        name: 'EcoCasa',
        points: 200,
        icon: 'home',
      },
    ];


  constructor(
    private readonly scanUiService:
      ScanUiService,

    private readonly historialService:
      HistorialService,

    private readonly authService:
      AuthService,
  ) {

    this.scanUiService
      .completed$
      .subscribe(() => {

        this.loadActivity();
      });
  }


  ngOnInit(): void {

    this.loadActivity();

    const user =
      this.authService.getUser();

    if (user) {

      this.userName =
        user.nombre;

      this.userInitials =
        `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`
          .toUpperCase();
    }
  }


  private loadActivity(): void {

    this.loadingActivity = true;
    this.activityError = false;

    this.historialService
      .findAll()
      .subscribe({

        next: (
          history: HistorialItem[],
        ) => {

          this.totalScans =
            history.length;


          this.recyclableWaste =
            history.filter(
              (scan) =>
                scan.reciclable,
            ).length;


          const aptScans =
            history.filter(
              (scan) =>
                scan.estado === 'apto',
            ).length;


          this.suitableWaste =
            aptScans;


          this.ecoPoints =
            aptScans * 10;


          if (
            history.length === 0
          ) {

            this.lastScan =
              null;

            this.loadingActivity =
              false;

            return;
          }


          const lastScan =
            history[0];


          this.lastScan = {

            name:
              lastScan.objeto,

            category:
              lastScan.material,

            categoria:
              lastScan.categoria,

            confidence:
              lastScan.confianza,

            recyclable:
              lastScan.reciclable,

            estado:
              lastScan.estado,

            icon:
              this.getCategoryIcon(
                lastScan.categoria,
              ),

            imagenUrl:
              lastScan.imagenUrl,
          };


          this.loadingActivity =
            false;
        },


        error: (
          error: unknown,
        ) => {

          console.error(
            'Error cargando actividad:',
            error,
          );

          this.totalScans = 0;

          this.recyclableWaste = 0;

          this.suitableWaste = 0;

          this.ecoPoints = 0;

          this.lastScan = null;

          this.loadingActivity =
            false;

          this.activityError =
            true;
        },
      });
  }


  get ecoLevel(): number {

    if (
      this.ecoPoints >= 200
    ) {
      return 5;
    }

    if (
      this.ecoPoints >= 120
    ) {
      return 4;
    }

    if (
      this.ecoPoints >= 80
    ) {
      return 3;
    }

    if (
      this.ecoPoints >= 30
    ) {
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


  get nextEcoUnlock():
    EcoUnlock | null {

    return (
      this.ecoUnlocks.find(
        (item) =>
          item.points >
          this.ecoPoints,
      ) ?? null
    );
  }


  get pointsToNextUnlock():
    number {

    const next =
      this.nextEcoUnlock;

    if (!next) {
      return 0;
    }

    return Math.max(
      0,
      next.points -
      this.ecoPoints,
    );
  }


  get ecoProgress(): number {

    const next =
      this.nextEcoUnlock;

    if (!next) {
      return 100;
    }

    const previous =
      [...this.ecoUnlocks]
        .reverse()
        .find(
          (item) =>
            item.points <=
            this.ecoPoints,
        );


    const previousPoints =
      previous?.points ?? 0;


    const range =
      next.points -
      previousPoints;


    const progress =
      this.ecoPoints -
      previousPoints;


    return Math.min(
      100,
      Math.round(
        (
          progress /
          range
        ) * 100,
      ),
    );
  }


  get unlockedEcoCount():
    number {

    return (
      this.ecoUnlocks
        .filter(
          (item) =>
            this.isEcoUnlocked(
              item.points,
            ),
        )
        .length
    );
  }


  get ecoWorldStage():
    number {

    return (
      this.unlockedEcoCount
    );
  }


  get ecoWorldImage():
    string {

    return (
      `assets/ecomundo/` +
      `mundo-${this.ecoWorldStage}.png`
    );
  }


  isEcoUnlocked(
    requiredPoints: number,
  ): boolean {

    return (
      this.ecoPoints >=
      requiredPoints
    );
  }


  get suitablePercentage():
    number {

    if (
      this.totalScans === 0
    ) {
      return 0;
    }

    return Math.round(
      (
        this.suitableWaste /
        this.totalScans
      ) * 100,
    );
  }


  retryActivity(): void {

    this.loadActivity();
  }


  getStatusName(
    scan: ScanResult,
  ): string {

    if (
      scan.estado === 'apto'
    ) {
      return 'Apto';
    }

    if (
      scan.estado === 'no_apto'
    ) {
      return 'No apto';
    }


    const object =
      scan.name
        ?.trim()
        .toLowerCase();


    return (
      scan.categoria ===
        'desconocido' &&
      object !==
        'objeto no identificado'
    )
      ? 'Fuera del alcance'
      : 'No identificado';
  }


  private getCategoryIcon(
    category: WasteCategory,
  ): string {

    const icons:
      Record<
        WasteCategory,
        string
      > = {

      plastico:
        'water-outline',

      lata:
        'beaker-outline',

      vidrio:
        'wine-outline',

      papel:
        'document-outline',

      carton:
        'cube-outline',

      desconocido:
        'help-circle-outline',
    };


    return icons[
      category
    ];
  }


  getImageUrl(
    imagenUrl: string | null,
  ): string | null {

    if (!imagenUrl) {
      return null;
    }


    if (
      imagenUrl.startsWith(
        'http://',
      ) ||
      imagenUrl.startsWith(
        'https://',
      )
    ) {
      return imagenUrl;
    }


    return (
      `http://localhost:3000${imagenUrl}`
    );
  }


  openScanOptions(): void {

    this.scanUiService.open();
  }
}