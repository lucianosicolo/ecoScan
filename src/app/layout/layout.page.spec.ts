import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { CameraSource } from '@capacitor/camera';
import type { Photo } from '@capacitor/camera';

import { LayoutPage } from './layout.page';

describe('LayoutPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LayoutPage],
      imports: [
        CommonModule,
        FormsModule,
        IonicModule.forRoot(),
        RouterTestingModule,
        HttpClientTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  it('creates the component with its required dependencies', () => {
    const fixture = TestBed.createComponent(LayoutPage);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
  it('opens the native camera with URI output and forwards the image', async () => {
    const page = TestBed.createComponent(LayoutPage).componentInstance;
    const photo = { webPath: 'capacitor://localhost/photo.jpg', format: 'jpeg' } as Photo;
    const camera = spyOn(page as any, 'requestPhoto').and.returnValue(Promise.resolve(photo));
    const process = spyOn(page as any, 'processPhoto').and.returnValue(Promise.resolve());

    await page.takePhoto();

    expect(camera).toHaveBeenCalledOnceWith(CameraSource.Camera);
    expect(process).toHaveBeenCalledOnceWith(photo);
  });

  it('opens the Android gallery and forwards its selected photo', async () => {
    const page = TestBed.createComponent(LayoutPage).componentInstance;
    const photo = { webPath: 'capacitor://localhost/gallery.png', format: 'png' } as Photo;
    const camera = spyOn(page as any, 'requestPhoto').and.returnValue(Promise.resolve(photo));
    const process = spyOn(page as any, 'processPhoto').and.returnValue(Promise.resolve());

    await page.selectFromGallery();

    expect(camera).toHaveBeenCalledOnceWith(CameraSource.Photos);
    expect(process).toHaveBeenCalledOnceWith(photo);
  });

  it('does not show an error when the user cancels the camera', async () => {
    const page = TestBed.createComponent(LayoutPage).componentInstance;
    spyOn(page as any, 'requestPhoto').and.rejectWith(new Error('User cancelled'));
    const showError = spyOn(page as any, 'showError').and.returnValue(Promise.resolve());

    await page.takePhoto();

    expect(showError).not.toHaveBeenCalled();
  });

  it('shows a recoverable error when camera access is denied', async () => {
    const page = TestBed.createComponent(LayoutPage).componentInstance;
    spyOn(page as any, 'requestPhoto').and.rejectWith(new Error('Permission denied'));
    const showError = spyOn(page as any, 'showError').and.returnValue(Promise.resolve());
    spyOn(console, 'error');

    await page.takePhoto();

    expect(showError).toHaveBeenCalledWith('No se pudo abrir o leer la imagen.');
  });

  it('explains when the scan backend cannot be reached', () => {
    const page = TestBed.createComponent(LayoutPage).componentInstance;
    const message = (page as any).getHttpErrorMessage({ status: 0 });

    expect(message).toContain('Comprobá que el backend esté encendido');
  });

});
