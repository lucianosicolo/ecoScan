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
  HistorialItem,
  HistorialService,
} from '../historial/historial.service';
import { AuthService } from '../auth/auth.service';

interface ScanResult {
  name: string;
  category: string;
  confidence: number;
  recyclable: boolean;
  estado: RecyclingStatus;
  icon: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  totalScans = 0;

  recyclableWaste = 0;

  lastScan: ScanResult | null = null;

  constructor(
    private readonly scanUiService:
      ScanUiService,

    private readonly historialService:
      HistorialService,
    private readonly authService:
      AuthService,
  ) { }

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
    this.historialService
      .findAll()
      .subscribe({
        next: (
          history: HistorialItem[],
        ) => {
          console.log(
            'Historial recibido en Home:',
            history,
          );

          this.totalScans =
            history.length;

          this.recyclableWaste =
            history.filter(
              (scan) =>
                scan.reciclable,
            ).length;

          if (
            history.length === 0
          ) {
            this.lastScan = null;

            return;
          }

          const lastScan =
            history[0];

          this.lastScan = {
            name:
              lastScan.objeto,

            category:
              lastScan.material,

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
          };

          console.log(
            'Último escaneo:',
            this.lastScan,
          );
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

          this.lastScan = null;
        },
      });
  }

  get recyclablePercentage(): number {
    if (
      this.totalScans === 0
    ) {
      return 0;
    }

    return Math.round(
      (
        this.recyclableWaste /
        this.totalScans
      ) * 100,
    );
  }

  getStatusName(
    status: RecyclingStatus,
  ): string {
    const names: Record<
      RecyclingStatus,
      string
    > = {
      apto:
        'Apto',

      no_apto:
        'No apto',

      desconocido:
        'Desconocido',
    };

    return names[
      status
    ];
  }

  private getCategoryIcon(
    category: WasteCategory,
  ): string {
    const icons: Record<
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
  userName = '';
  userInitials = '';
  openScanOptions(): void {
    this.scanUiService.open();
  }
}