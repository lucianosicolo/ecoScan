import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';

import { PuntosVerdesPage } from './puntos-verdes.page';

describe('PuntosVerdesPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PuntosVerdesPage],
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
    const fixture = TestBed.createComponent(PuntosVerdesPage);
    // Avoid external Google Maps/Geocoding calls in a component smoke test.
    spyOn(fixture.componentInstance as any, 'loadMap').and.resolveTo();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
