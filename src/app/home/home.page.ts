import { Component } from '@angular/core';
import {
  ActionSheetController,
  NavController
} from '@ionic/angular';

interface WasteCategory {
  name: string;
  icon: string;
  color: string;
  background: string;
}
type RecyclingStatus =
  | 'listo'
  | 'requiere_preparacion'
  | 'no_apto';

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
  standalone: false
})
export class HomePage {

  totalScans = 12;
  recyclableWaste = 9;

 lastScan: ScanResult | null = {
  name: 'Botella de plástico',
  category: 'Plástico PET',
  confidence: 94,
  recyclable: true,
  estado: 'requiere_preparacion',
  icon: 'water-outline',
};

  categories: WasteCategory[] = [
    {
      name: 'Plástico',
      icon: 'water-outline',
      color: '#2778c4',
      background: '#e8f2fb'
    },
    {
      name: 'Vidrio',
      icon: 'wine-outline',
      color: '#25a865',
      background: '#e8f7ee'
    },
 {
  name: 'Latas',
  icon: 'beaker-outline',
  color: '#767f85',
  background: '#edf0f2',
},
    {
      name: 'Papel',
      icon: 'document-outline',
      color: '#d19a29',
      background: '#fff5db'
    },
    {
      name: 'Cartón',
      icon: 'cube-outline',
      color: '#a96d35',
      background: '#f7eadf'
    }
  ];

  constructor(
    private actionSheetController: ActionSheetController,
    private navController: NavController
  ) {}

  get recyclablePercentage(): number {
    if (!this.totalScans) {
      return 0;
    }

    return Math.round(
      (this.recyclableWaste / this.totalScans) * 100
    );
  }
getStatusName(
  status: RecyclingStatus,
): string {
  const names: Record<
    RecyclingStatus,
    string
  > = {
    listo: 'Listo',
    requiere_preparacion:
      'Requiere preparación',
    no_apto: 'No apto',
  };

  return names[status];
}
  async openScanOptions(): Promise<void> {
    const actionSheet =
      await this.actionSheetController.create({
        header: 'Identificar un residuo',
        subHeader: 'Elegí de dónde querés obtener la imagen',
        cssClass: 'scan-action-sheet',
        buttons: [
          {
            text: 'Tomar una foto',
            icon: 'camera-outline',
            handler: () => {
              this.openScanner('camera');
            }
          },
          {
            text: 'Elegir de la galería',
            icon: 'images-outline',
            handler: () => {
              this.openScanner('gallery');
            }
          },
          {
            text: 'Cancelar',
            icon: 'close-outline',
            role: 'cancel'
          }
        ]
      });

    await actionSheet.present();
  }

  private openScanner(source: 'camera' | 'gallery'): void {
    this.navController.navigateForward('/app/escanear', {
      queryParams: {
        source
      }
    });
  }
}