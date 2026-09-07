import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';

type WasteCategory =
  | 'plastico'
  | 'lata'
  | 'vidrio'
  | 'papel'
  | 'carton';

type HistoryFilter =
  | 'todos'
  | WasteCategory;
interface ScanHistoryItem {
  id: string;
  categoria: WasteCategory;
  objeto: string;
  material: string;
  reciclable: boolean;
  estado: RecyclingStatus;
  confianza: number;
  preparacion: string[];
  observacion: string;
  createdAt: string;
}
type RecyclingStatus =
  | 'apto'
  | 'no_apto';
interface FilterOption {
  value: HistoryFilter;
  label: string;
}

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
  standalone: false,
})
export class HistorialPage {
  selectedFilter: HistoryFilter = 'todos';

  selectedScan: ScanHistoryItem | null = null;
  isDetailOpen = false;
  getStatusName(
    status: RecyclingStatus,
  ): string {
    const names: Record<
      RecyclingStatus,
      string
    > = {
      apto: 'Apto',
      no_apto: 'No apto',
    };

    return names[status];
  }

  getStatusIcon(
    status: RecyclingStatus,
  ): string {
    const icons: Record<
      RecyclingStatus,
      string
    > = {
      apto: 'checkmark-circle',
      no_apto: 'close-circle',
    };

    return icons[status];
  }

  getStatusClass(
    status: RecyclingStatus,
  ): string {
    return `status-${status}`;
  }
  readonly filters: FilterOption[] = [
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
  ];

  history: ScanHistoryItem[] = [
    {
      id: '1',
      categoria: 'plastico',
      objeto: 'Botella de agua',
      material: 'Plástico PET',
      reciclable: true,
      estado: 'apto',
      confianza: 98,
      preparacion: [
        'Vaciar todo el contenido',
        'Enjuagar el envase',
        'Aplastar la botella',
        'Separar la tapa',
      ],
      observacion:
        'Botella plástica transparente de bebida.',
      createdAt: new Date(
        Date.now() - 15 * 60 * 1000,
      ).toISOString(),
    },
    {
  id: '2',
  categoria: 'lata',
  objeto: 'Lata de gaseosa',
  material: 'Aluminio',
  reciclable: true,
  estado: 'apto',
  confianza: 96,
  preparacion: [
    'Verificá que esté completamente vacía',
    'Enjuagala si contiene restos',
    'Dejala secar',
  ],
  observacion:
    'Lata de aluminio apta para reciclaje después de prepararla.',
  createdAt: new Date(
    Date.now() - 2 * 60 * 60 * 1000,
  ).toISOString(),
},
 {
  id: '3',
  categoria: 'carton',
  objeto: 'Caja de envío',
  material: 'Cartón corrugado',
  reciclable: true,
  estado: 'apto',
  confianza: 94,
  preparacion: [
    'Verificá que esté limpia y seca',
    'Retirá cintas y elementos plásticos',
    'Desarmá y aplaná la caja',
  ],
  observacion:
    'Caja de cartón apta para reciclaje después de prepararla.',
  createdAt: new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString(),
},
 {
  id: '4',
  categoria: 'vidrio',
  objeto: 'Frasco de conservas',
  material: 'Vidrio transparente',
  reciclable: true,
  estado: 'apto',
  confianza: 91,
  preparacion: [
    'Verificá que esté completamente vacío',
    'Enjuagalo si contiene restos',
    'Retirá la tapa',
    'Dejalo secar',
  ],
  observacion:
    'Frasco de vidrio apto para reciclaje después de prepararlo.',
  createdAt: new Date(
    Date.now() - 2 * 24 * 60 * 60 * 1000,
  ).toISOString(),
},
    {
      id: '5',
      categoria: 'papel',
      objeto: 'Papel contaminado',
      material: 'Papel',
      reciclable: false,
      estado: 'no_apto',
      confianza: 89,
      preparacion: [],
      observacion:
        'El papel presenta humedad y restos de comida visibles.',
      createdAt: new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    }
  ];

  constructor(
    private readonly alertController: AlertController,
  ) { }

  get filteredHistory(): ScanHistoryItem[] {
    if (this.selectedFilter === 'todos') {
      return this.history;
    }

    return this.history.filter(
      (scan) =>
        scan.categoria === this.selectedFilter,
    );
  }

  get recyclableCount(): number {
    return this.history.filter(
      (scan) => scan.reciclable,
    ).length;
  }

  get averageConfidence(): number {
    if (this.history.length === 0) {
      return 0;
    }

    const total = this.history.reduce(
      (sum, scan) =>
        sum + scan.confianza,
      0,
    );

    return Math.round(
      total / this.history.length,
    );
  }

  selectFilter(
    filter: HistoryFilter,
  ): void {
    this.selectedFilter = filter;
  }

  openDetail(
    scan: ScanHistoryItem,
  ): void {
    this.selectedScan = scan;
    this.isDetailOpen = true;
  }

  closeDetail(): void {
    this.isDetailOpen = false;

    setTimeout(() => {
      this.selectedScan = null;
    }, 250);
  }

  async confirmDelete(
    scan: ScanHistoryItem,
    event: Event,
  ): Promise<void> {
    event.stopPropagation();

    const alert =
      await this.alertController.create({
        header: 'Eliminar escaneo',
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
              this.history =
                this.history.filter(
                  (item) =>
                    item.id !== scan.id,
                );
            },
          },
        ],
      });

    await alert.present();
  }

  async confirmClearHistory(): Promise<void> {
    const alert =
      await this.alertController.create({
        header: 'Vaciar historial',
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
              this.history = [];
              this.selectedFilter = 'todos';
            },
          },
        ],
      });

    await alert.present();
  }

  getCategoryName(
    category: WasteCategory,
  ): string {
    const names: Record<
      WasteCategory,
      string
    > = {
      plastico: 'Plástico',
      lata: 'Lata',
      vidrio: 'Vidrio',
      papel: 'Papel',
      carton: 'Cartón',
    };

    return names[category];
  }

  getCategoryIcon(
    category: WasteCategory,
  ): string {
    const icons: Record<
      WasteCategory,
      string
    > = {
      plastico: 'water-outline',
      lata: 'beaker-outline',
      vidrio: 'wine-outline',
      papel: 'document-text-outline',
      carton: 'cube-outline',
    };

    return icons[category];
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat(
      'es-AR',
      {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      },
    ).format(new Date(date));
  }

  trackById(
    _index: number,
    scan: ScanHistoryItem,
  ): string {
    return scan.id;
  }
}