import { Component } from '@angular/core';

import {
  ScanUiService,
} from '../scan/services/scan-ui.service';

interface WasteCategory {
  name: string;
  icon: string;
  color: string;
  background: string;
}

type RecyclingStatus =
  | 'apto'
  | 'desconocido'
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
  standalone: false,
})
export class HomePage {

  totalScans = 12;
  recyclableWaste = 9;

  lastScan: ScanResult | null = {
    name: 'Botella de plástico',
    category: 'Plástico PET',
    confidence: 94,
    recyclable: true,
    estado: 'apto',
    icon: 'water-outline',
  };

  categories: WasteCategory[] = [
    {
      name: 'Plástico',
      icon: 'water-outline',
      color: '#2778c4',
      background: '#e8f2fb',
    },
    {
      name: 'Vidrio',
      icon: 'wine-outline',
      color: '#25a865',
      background: '#e8f7ee',
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
      background: '#fff5db',
    },
    {
      name: 'Cartón',
      icon: 'cube-outline',
      color: '#a96d35',
      background: '#f7eadf',
    },
  ];

  constructor(
    private readonly scanUiService:
      ScanUiService,
  ) {}

  get recyclablePercentage(): number {
    if (!this.totalScans) {
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
      apto: 'Apto',
      desconocido: 'Desconocido',
      no_apto: 'No apto',
    };

    return names[status];
  }

  openScanOptions(): void {
    this.scanUiService.open();
  }
}