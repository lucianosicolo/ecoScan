import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type WasteCategory =
  | 'plastico'
  | 'lata'
  | 'vidrio'
  | 'papel'
  | 'carton'
  | 'desconocido';

export interface ScanResult {
  categoria: WasteCategory;
  objeto: string;
  material: string;
  reciclable: boolean;
  estado: RecyclingStatus;
  confianza: number;
  preparacion: string[];
  observacion: string;
}
export type RecyclingStatus =
  | 'listo'
  | 'requiere_preparacion'
  | 'no_apto'
  | 'desconocido';

@Injectable({
  providedIn: 'root',
})
export class ScanService {
  private readonly apiUrl =
    'http://localhost:3000/scan';

  constructor(
    private readonly http: HttpClient,
  ) {}

  analyzeImage(
    image: Blob,
    filename: string,
  ): Observable<ScanResult> {
    const formData = new FormData();

    formData.append(
      'image',
      image,
      filename,
    );

    return this.http.post<ScanResult>(
      this.apiUrl,
      formData,
    );
  }
}