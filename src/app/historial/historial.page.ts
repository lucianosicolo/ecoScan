import { scanImageUrl } from '../config/api.config';
import {
  Component,
} from '@angular/core';

import {
  AlertController,
  ToastController,
} from '@ionic/angular';

import {
  forkJoin,
} from 'rxjs';

import {
  RecyclingStatus,
  WasteCategory,
} from '../scan/services/scan.service';

import {
  ScanUiService,
} from '../scan/services/scan-ui.service';

import {
  HistorialItem,
  HistorialService,
} from './historial.service';


type HistoryFilter =
  | 'todos'
  | WasteCategory;


interface FilterOption {
  value: HistoryFilter;
  label: string;
}


@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: [
    './historial.page.scss',
  ],
  standalone: false,
})
export class HistorialPage {

  selectedFilter:
    HistoryFilter = 'todos';

  selectedScan:
    HistorialItem | null = null;

  isDetailOpen = false;

  imageViewerOpen = false;

  imageViewerUrl:
    string | null = null;

  loading = false;

  loadError = false;

  history:
    HistorialItem[] = [];


  readonly filters:
    FilterOption[] = [
      {
        value: 'todos',
        label: 'Todos',
      },
      {
        value: 'plastico',
        label: 'PET',
      },
      {
        value: 'lata',
        label: 'Aluminio',
      },
      {
        value: 'vidrio',
        label: 'Vidrio',
      },
      {
        value: 'papel',
        label: 'Papel',
      },
      {
        value: 'carton',
        label: 'Cartón',
      },
      {
        value: 'desconocido',
        label: 'No clasificables',
      },
    ];


  constructor(
    private readonly alertController:
      AlertController,

    private readonly toastController:
      ToastController,

    private readonly historialService:
      HistorialService,

    private readonly scanUiService:
      ScanUiService,
  ) {}


  ngOnInit(): void {
    this.ionViewWillEnter();
  }

  ionViewWillEnter(): void {

    this.loadHistory();
  }


  loadHistory(): void {

    this.loading = true;
    this.loadError = false;


    this.historialService
      .findAll()
      .subscribe({

        next: (
          history:
            HistorialItem[],
        ) => {

          this.history =
            history;

          this.loading =
            false;
        },


        error: async (
          error: unknown,
        ) => {

          console.error(
            'Error cargando historial:',
            error,
          );

          this.loading =
            false;

          this.loadError =
            true;


          const toast =
            await this.toastController
              .create({

                message:
                  'No se pudo cargar el historial.',

                duration:
                  2500,

                color:
                  'danger',

                position:
                  'bottom',
              });


          await toast.present();
        },
      });
  }


  get filteredHistory():
    HistorialItem[] {

    if (
      this.selectedFilter ===
      'todos'
    ) {

      return this.history;
    }


    return this.history.filter(
      (scan) =>
        scan.categoria ===
        this.selectedFilter,
    );
  }


  get suitableCount():
    number {

    return this.history.filter(
      (scan) =>
        scan.estado ===
        'apto',
    ).length;
  }


  get ecoPoints():
    number {

    return (
      this.suitableCount *
      10    );
  }


  selectFilter(
    filter: HistoryFilter,
  ): void {

    this.selectedFilter =
      filter;
  }


  openScan(): void {

    this.scanUiService
      .open();
  }


  openDetail(
    scan: HistorialItem,
  ): void {

    this.selectedScan =
      scan;

    this.isDetailOpen =
      true;
  }


  closeDetail(): void {

    this.isDetailOpen =
      false;


    setTimeout(
      () => {

        this.selectedScan =
          null;

      },
      250,
    );
  }


  async confirmDelete(
    scan: HistorialItem,
    event: Event,
  ): Promise<void> {

    event.stopPropagation();


    const alert =
      await this.alertController
        .create({

          header:
            'Eliminar escaneo',

          message:
            `¿Querés eliminar “${scan.objeto}” del historial?`,

          buttons: [
            {
              text:
                'Cancelar',

              role:
                'cancel',
            },
            {
              text:
                'Eliminar',

              role:
                'destructive',

              handler: () => {

                this.deleteScan(
                  scan.id,
                );
              },
            },
          ],
        });


    await alert.present();
  }


  private deleteScan(
    id: number,
  ): void {

    this.historialService
      .remove(
        id,
      )
      .subscribe({

        next: () => {

          this.history =
            this.history.filter(
              (item) =>
                item.id !== id,
            );


          if (
            this.selectedScan?.id ===
            id
          ) {

            this.closeDetail();
          }
        },


        error: async (
          error: unknown,
        ) => {

          console.error(
            'Error eliminando escaneo:',
            error,
          );


          const toast =
            await this.toastController
              .create({

                message:
                  'No se pudo eliminar el escaneo.',

                duration:
                  2500,

                color:
                  'danger',

                position:
                  'bottom',
              });


          await toast.present();
        },
      });
  }


  async confirmClearHistory():
    Promise<void> {

    if (
      this.history.length ===
      0
    ) {

      return;
    }


    const alert =
      await this.alertController
        .create({

          header:
            'Vaciar historial',

          message:
            'Se eliminarán todos los escaneos guardados y se reiniciará el progreso de EcoMundo.',

          buttons: [
            {
              text:
                'Cancelar',

              role:
                'cancel',
            },
            {
              text:
                'Vaciar',

              role:
                'destructive',

              handler: () => {

                this.clearHistory();
              },
            },
          ],
        });


    await alert.present();
  }


  private clearHistory():
    void {

    const requests =
      this.history.map(
        (scan) =>
          this.historialService
            .remove(
              scan.id,            ),
      );


    if (
      requests.length ===
      0
    ) {

      return;
    }


    forkJoin(
      requests,
    )
      .subscribe({

        next: () => {

          this.history = [];

          this.selectedFilter =
            'todos';

          this.closeDetail();
        },


        error: async (
          error: unknown,
        ) => {

          console.error(
            'Error vaciando historial:',
            error,
          );


          const toast =
            await this.toastController
              .create({

                message:
                  'No se pudo vaciar completamente el historial.',

                duration:
                  2500,

                color:
                  'danger',

                position:
                  'bottom',
              });


          await toast.present();

          this.loadHistory();
        },
      });
  }


  isOutOfScope(
    scan: HistorialItem,
  ): boolean {

    const object =
      scan.objeto
        ?.trim()
        .toLowerCase();


    return (
      scan.categoria ===
        'desconocido' &&
      !!object &&
      object !==
        'objeto no identificado'
    );
  }


  getHistoryCategoryName(
    scan: HistorialItem,
  ): string {

    if (
      scan.categoria !==
      'desconocido'
    ) {

      return this.getCategoryName(
        scan.categoria,
      );
    }


    return this.isOutOfScope(
      scan,
    )
      ? 'Fuera del alcance'
      : 'No identificado';
  }


  getHistoryStatusName(
    scan: HistorialItem,
  ): string {

    if (
      scan.estado ===
      'apto'
    ) {

      return 'Apto';
    }


    if (
      scan.estado ===
      'no_apto'
    ) {

      return 'No apto';
    }


    return this.isOutOfScope(
      scan,
    )
      ? 'Fuera del alcance'
      : 'No identificado';
  }


  getStatusIcon(
    status: RecyclingStatus,
  ): string {

    const icons:
      Record<
        RecyclingStatus,
        string
      > = {

      apto:
        'checkmark-circle',

      no_apto:
        'close-circle',

      desconocido:
        'help-circle',
    };


    return icons[
      status
    ];
  }


  getStatusClass(
    status: RecyclingStatus,
  ): string {

    return (
      `status-${status}`
    );
  }


  getCategoryName(
    category: WasteCategory,
  ): string {

    const names:
      Record<
        WasteCategory,
        string
      > = {

      plastico:
        'PET',

      lata:
        'Aluminio',

      vidrio:
        'Vidrio',

      papel:
        'Papel',

      carton:
        'Cartón',

      desconocido:
        'Desconocido',
    };


    return names[
      category
    ];
  }


  getCategoryIcon(
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
        'document-text-outline',

      carton:
        'cube-outline',

      desconocido:
        'help-circle-outline',
    };


    return icons[
      category
    ];
  }


  trackById(_index: number, scan: HistorialItem): number {
    return scan.id;
  }

  formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  openImageViewer(scan: HistorialItem): void {
    const url = this.getImageUrl(scan.imagenUrl);

    if (!url) {
      return;
    }

    this.imageViewerUrl = url;
    this.imageViewerOpen = true;
  }

  closeImageViewer(): void {
    this.imageViewerOpen = false;
    this.imageViewerUrl = null;
  }

  getImageUrl(imagenUrl: string | null): string | null {
    return scanImageUrl(imagenUrl);
  }
}
