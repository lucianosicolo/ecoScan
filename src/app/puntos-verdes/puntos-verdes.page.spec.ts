import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PuntosVerdesPage } from './puntos-verdes.page';

describe('PuntosVerdesPage', () => {
  let component: PuntosVerdesPage;
  let fixture: ComponentFixture<PuntosVerdesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PuntosVerdesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
