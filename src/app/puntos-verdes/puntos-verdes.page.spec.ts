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
  it('opens the same point in Google Maps if the embedded key is restricted', () => {
    const fixture = TestBed.createComponent(PuntosVerdesPage);
    const page = fixture.componentInstance;
    const point = page.recyclingPoints[0];
    const event = { stopPropagation: jasmine.createSpy('stopPropagation') } as unknown as Event;
    const external = spyOn(window, 'open').and.returnValue(null);
    page.mapError = true;

    page.viewDetails(point, event);

    expect(event.stopPropagation).toHaveBeenCalled();
    const expected = 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(point.address + ', Argentina');
    expect(external).toHaveBeenCalledWith(expected, '_blank', 'noopener,noreferrer');
  });

  it('keeps the existing embedded map interaction unchanged on desktop', () => {
    const fixture = TestBed.createComponent(PuntosVerdesPage);
    const page = fixture.componentInstance;
    const point = page.recyclingPoints[0];
    const event = { stopPropagation: jasmine.createSpy('stopPropagation') } as unknown as Event;
    const select = spyOn(page, 'selectPoint');
    page.mapError = false;

    page.viewDetails(point, event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(select).toHaveBeenCalledOnceWith(point);
  });

});
