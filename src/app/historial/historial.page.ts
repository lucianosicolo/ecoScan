import {
  Component,
  OnInit,
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

  loading = false;

  history: HistorialItem[] = [];

  readonly filters:
    FilterOption[] = [
      {
        value: 'todos',
        label: 'Todos',
      },
      {
        value: 'plastico',
        label: 'Plástico',
      },
      {
        value: 'lata',
        label: 'Latas',
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
        label: 'Desconocidos',
      },
    ];

  constructor(
    private readonly alertController:
      AlertController,

    private readonly toastController:
      ToastController,

    private readonly historialService:
      HistorialService,
  ) { }

  ngOnInit(): void {
    this.loadHistory();
  }
ionViewWillEnter(): void {
  this.loadHistory();
}

  loadHistory(): void {
    this.loading = true;

    this.historialService
      .findAll()
      .subscribe({
        next: (
          history: HistorialItem[],
        ) => {
          console.log(
            'Historial recibido:',
            history,
          );

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

          const toast =
            await this.toastController
              .create({
                message:
                  'No se pudo cargar el historial.',
                duration: 2500,
                color: 'danger',
                position: 'bottom',
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

  get recyclableCount():
    number {

    return this.history.filter(
      (scan) =>
        scan.reciclable,
    ).length;
  }

  get averageConfidence():
    number {

    if (
      this.history.length === 0
    ) {
      return 0;
    }

    const total =
      this.history.reduce(
        (
          sum,
          scan,
        ) =>
          sum +
          scan.confianza,
        0,
      );

    return Math.round(
      total /
      this.history.length,
    );
  }

  selectFilter(
    filter: HistoryFilter,
  ): void {

    this.selectedFilter =
      filter;
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
              text: 'Cancelar',
              role: 'cancel',
            },
            {
              text: 'Eliminar',
              role: 'destructive',

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
      .remove(id)
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
                duration: 2500,
                color: 'danger',
                position: 'bottom',
              });

          await toast.present();
        },
      });
  }

  async confirmClearHistory():
    Promise<void> {

    if (
      this.history.length === 0
    ) {
      return;
    }

    const alert =
      await this.alertController
        .create({
          header:
            'Vaciar historial',

          message:
            'Se eliminarán todos los escaneos guardados.',

          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel',
            },
            {
              text: 'Vaciar',
              role: 'destructive',

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
              scan.id,
            ),
      );

    if (
      requests.length === 0
    ) {
      return;
    }

    forkJoin(
      requests,
    ).subscribe({
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
              duration: 2500,
              color: 'danger',
              position: 'bottom',
            });

        await toast.present();

        this.loadHistory();
      },
    });
  }

  getStatusName(
    status: RecyclingStatus,
  ): string {

    const names:
      Record<
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
imageViewerOpen = false;

imageViewerUrl: string | null = null;
openImageViewer(
  scan: HistorialItem,
): void {

  if (!scan.imagenUrl) {
    return;
  }

  this.imageViewerUrl =
    this.getImageUrl(
      scan.imagenUrl,
    );

  this.imageViewerOpen = true;
}

closeImageViewer(): void {

  this.imageViewerOpen = false;

  setTimeout(
    () => {
      this.imageViewerUrl = null;
    },
    200,
  );
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
        'Plástico',

      lata:
        'Lata',

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
  getImageUrl(
    imagenUrl: string | null,
  ): string | null {

    if (!imagenUrl) {
      return null;
    }

    return (
      `http://localhost:3000${imagenUrl}`
    );
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

  formatDate(
    date: string,
  ): string {

    return new Intl
      .DateTimeFormat(
        'es-AR',
        {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        },
      )
      .format(
        new Date(
          date,
        ),
      );
  }

  trackById(
    _index: number,
    scan: HistorialItem,
  ): number {

    return scan.id;
  }
}