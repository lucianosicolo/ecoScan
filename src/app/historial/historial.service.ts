import {
    Injectable,
} from '@angular/core';

import {
    HttpClient,
} from '@angular/common/http';

import {
    Observable,
} from 'rxjs';
import { RecyclingStatus, WasteCategory } from '../scan/services/scan.service';



export interface HistorialItem {
    id: number;

    categoria: WasteCategory;

    objeto: string;

    material: string;

    reciclable: boolean;

    estado: RecyclingStatus;

    confianza: number;

    preparacion: string[];

    observacion: string;
  imagenUrl: string | null;
    createdAt: string;
}

@Injectable({
    providedIn: 'root',
})
export class HistorialService {

    private readonly apiUrl =
        'http://localhost:3000/historial';

    constructor(
        private readonly http: HttpClient,
    ) { }

    findAll():
        Observable<HistorialItem[]> {

        return this.http.get<
            HistorialItem[]
        >(
            this.apiUrl,
        );
    }

    findOne(
        id: number,
    ): Observable<HistorialItem> {

        return this.http.get<
            HistorialItem
        >(
            `${this.apiUrl}/${id}`,
        );
    }

    remove(
        id: number,
    ): Observable<void> {

        return this.http.delete<void>(
            `${this.apiUrl}/${id}`,
        );
    }
    
}