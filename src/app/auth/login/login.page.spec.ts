import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';

import { LoginPage } from './login.page';

describe('LoginPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginPage],
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
    const fixture = TestBed.createComponent(LoginPage);
    // La hidratación asíncrona de ion-input se prueba en el navegador real.
    // Evitamos depender de su ciclo de vida dentro del fixture aislado.
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.serverAddress).toContain('http');
  });
});
