import { Location } from '@angular/common';

import {
  AfterViewInit,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
} from '@angular/core';

import {
  NavigationEnd,
  Router,
} from '@angular/router';

import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';
import {
  App,
} from '@capacitor/app';
import {
  filter,
  firstValueFrom,
} from 'rxjs';

import {
  AlertController,
  IonContent,
} from '@ionic/angular';

import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';

import {
  ScanResult,
  ScanService,
} from '../scan/services/scan.service';

import {
  ScanUiService,
} from '../scan/services/scan-ui.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.page.html',
  styleUrls: ['./layout.page.scss'],
  standalone: false,
})
export class LayoutPage implements AfterViewInit, OnInit {

  hasNotifications = false;

  scanResult: ScanResult | null = null;

  isScanOptionsOpen = false;
  isScanResultOpen = false;
  isScanning = false;

  scanPreviewUrl: string | null = null;
  scanStatusIndex = 0;

  @ViewChild('layoutContent')
  private layoutContent!: IonContent;

  readonly scanStatuses: string[] = [
    'Procesando imagen',
    'Identificando el residuo',
    'Analizando el material',
    'Comprobando reciclabilidad',
  ];

  private scanStatusInterval:
    ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly location: Location,
    private readonly router: Router,
    private readonly destroyRef: DestroyRef,
    private readonly alertController:
      AlertController,
    private readonly scanService:
      ScanService,
    private readonly scanUiService:
      ScanUiService,
  ) {
    this.scanUiService.open$
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe(() => {
        this.openScanOptions();
      });
  }
  ngOnInit(): void {

    App.addListener(
      'appRestoredResult',
      async (data) => {

        if (
          data.pluginId !== 'Camera' ||
          data.methodName !== 'getPhoto'
        ) {
          return;
        }

        if (
          !data.success ||
          !data.data
        ) {
          return;
        }

        const photo =
          data.data as Photo;

        await this.processPhoto(
          photo,
        );
      },
    );
  }
  getScanImageUrl(
    imagenUrl?: string,
  ): string | null {

    if (!imagenUrl) {
      return null;
    }

    return `http://localhost:3000${imagenUrl}`;
  }
  getConfidenceLabel(
  confidence: number,
): string {

  if (confidence >= 80) {
    return 'Confianza alta';
  }

  if (confidence >= 60) {
    return 'Confianza media';
  }

  return 'Confianza baja';
}

getConfidenceClass(
  confidence: number,
): string {

  if (confidence >= 80) {
    return 'confidence-high';
  }

  if (confidence >= 60) {
    return 'confidence-medium';
  }

  return 'confidence-low';
}
  ngAfterViewInit(): void {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd,
        ),
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe(() => {
        void this.layoutContent.scrollToTop(0);
      });
  }

  get currentScanStatus(): string {
    return this.scanStatuses[
      this.scanStatusIndex
    ];
  }

  get isHomePage(): boolean {
    return (
      this.router.url === '/app' ||
      this.router.url.startsWith(
        '/app/home',
      )
    );
  }

  openScanOptions(): void {
    this.isScanOptionsOpen = true;
  }

  closeScanOptions(): void {
    this.isScanOptionsOpen = false;
  }

  selectCamera(): void {
    this.closeScanOptions();

    setTimeout(() => {
      void this.takePhoto();
    }, 200);
  }

  selectGallery(): void {
    this.closeScanOptions();

    setTimeout(() => {
      void this.selectFromGallery();
    }, 200);
  }

  async takePhoto(): Promise<void> {
    try {
      const photo = await Camera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.Uri,
        quality: 75,
        width: 1280,
        height: 1280,
        correctOrientation: true,
      });

      await this.processPhoto(photo);
    } catch (error) {
      await this.handleCameraError(error);
    }
  }

  async selectFromGallery(): Promise<void> {
    try {
      const photo = await Camera.getPhoto({
        source: CameraSource.Photos,
        resultType: CameraResultType.Uri,
        quality: 75,
        width: 1280,
        height: 1280,
        correctOrientation: true,
      });

      await this.processPhoto(photo);
    } catch (error) {
      await this.handleCameraError(error);
    }
  }

  private async processPhoto(
    photo: Photo,
  ): Promise<void> {

    if (!photo.webPath) {
      await this.showError(
        'No se pudo leer la imagen seleccionada.',
      );

      return;
    }

    this.startScanning(
      photo.webPath,
    );

    try {
      const imageResponse =
        await fetch(photo.webPath);

      const imageBlob =
        await imageResponse.blob();

      const extension =
        photo.format || 'jpeg';

      const filename =
        `residuo-${Date.now()}.${extension}`;

      const result =
        await firstValueFrom(
          this.scanService.analyzeImage(
            imageBlob,
            filename,
          ),
        );

      this.stopScanning();

      await this.pause(250);

      this.showResult(result);

    } catch (error: unknown) {
      console.error(
        'Error al escanear:',
        error,
      );

      this.stopScanning();

      const message =
        this.getHttpErrorMessage(
          error,
        );

      await this.showError(
        message,
      );
    }
  }

  private showResult(
    result: ScanResult,
  ): void {
    this.scanResult = result;

    setTimeout(() => {
      this.isScanResultOpen = true;
    }, 100);
  }

  closeScanResult(): void {
    this.isScanResultOpen = false;
  }

  onScanResultDismissed(): void {
    this.scanResult = null;
  }

  private startScanning(
    previewUrl: string,
  ): void {
    this.scanPreviewUrl =
      previewUrl;

    this.scanStatusIndex = 0;
    this.isScanning = true;

    if (this.scanStatusInterval) {
      clearInterval(
        this.scanStatusInterval,
      );
    }

    this.scanStatusInterval =
      setInterval(() => {
        this.scanStatusIndex =
          (
            this.scanStatusIndex + 1
          ) %
          this.scanStatuses.length;
      }, 1800);
  }

  private stopScanning(): void {
    this.isScanning = false;

    if (this.scanStatusInterval) {
      clearInterval(
        this.scanStatusInterval,
      );

      this.scanStatusInterval = null;
    }

    setTimeout(() => {
      this.scanPreviewUrl = null;
    }, 300);
  }

  private pause(
    milliseconds: number,
  ): Promise<void> {
    return new Promise(
      (resolve) => {
        setTimeout(
          resolve,
          milliseconds,
        );
      },
    );
  }

  getCategoryName(
    category: ScanResult['categoria'],
  ): string {

    const categoryNames: Record<
      ScanResult['categoria'],
      string
    > = {
      plastico: 'Plástico',
      lata: 'Lata',
      vidrio: 'Vidrio',
      papel: 'Papel',
      carton: 'Cartón',
      desconocido: 'Desconocido',
    };

    return categoryNames[
      category
    ];
  }

  getResultIcon(
    category: ScanResult['categoria'],
  ): string {

    const categoryIcons: Record<
      ScanResult['categoria'],
      string
    > = {
      plastico: 'water-outline',
      lata: 'beaker-outline',
      vidrio: 'wine-outline',
      papel: 'document-outline',
      carton: 'cube-outline',
      desconocido: 'help-outline',
    };

    return categoryIcons[
      category
    ];
  }

  getStatusName(
    status: ScanResult['estado'],
  ): string {

    const names: Record<
      ScanResult['estado'],
      string
    > = {
      apto: 'Listo para reciclar',
      no_apto:
        'No apto para reciclar',
      desconocido:
        'Fuera del alcance',
    };

    return names[
      status
    ];
  }

  getStatusIcon(
    status: ScanResult['estado'],
  ): string {

    const icons: Record<
      ScanResult['estado'],
      string
    > = {
      apto:
        'checkmark-circle-outline',
      no_apto:
        'close-circle-outline',
      desconocido:
        'help-circle-outline',
    };

    return icons[
      status
    ];
  }

  private async handleCameraError(
    error: unknown,
  ): Promise<void> {

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    const normalizedMessage =
      message.toLowerCase();

    const wasCancelled =
      normalizedMessage.includes(
        'cancel',
      ) ||
      normalizedMessage.includes(
        'user cancelled',
      );

    if (wasCancelled) {
      return;
    }

    console.error(
      'Error de cámara:',
      error,
    );

    await this.showError(
      'No se pudo abrir o leer la imagen.',
    );
  }

  private getHttpErrorMessage(
    error: unknown,
  ): string {

    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error
    ) {

      const httpError =
        error as {
          error?: {
            message?:
            string | string[];
          };
        };

      const message =
        httpError.error?.message;

      if (
        Array.isArray(message)
      ) {
        return message.join('. ');
      }

      if (
        typeof message === 'string'
      ) {
        return message;
      }
    }

    return (
      'No se pudo analizar la imagen. ' +
      'Comprobá que el backend esté encendido.'
    );
  }

  private async showError(
    message: string,
  ): Promise<void> {

    const alert =
      await this.alertController.create({
        header:
          'Ocurrió un problema',
        message,
        buttons: ['Aceptar'],
      });

    await alert.present();
  }

  goBack(): void {
    this.location.back();
  }
}