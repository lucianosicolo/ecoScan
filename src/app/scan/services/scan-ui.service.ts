import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScanUiService {
  private readonly openSubject =
    new Subject<void>();

  readonly open$ =
    this.openSubject.asObservable();

  open(): void {
    this.openSubject.next();
  }
}