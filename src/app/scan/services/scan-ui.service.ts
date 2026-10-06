import {
  Injectable,
} from '@angular/core';

import {
  Subject,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScanUiService {

  private readonly openSubject =
    new Subject<void>();

  private readonly completedSubject =
    new Subject<void>();

  readonly open$ =
    this.openSubject.asObservable();

  readonly completed$ =
    this.completedSubject.asObservable();

  open(): void {
    this.openSubject.next();
  }

  notifyCompleted(): void {
    this.completedSubject.next();
  }
}