import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PagosPageRoutingModule } from './puntos-verdes-routing.module';
import { PuntosVerdesPage } from './puntos-verdes.page';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PagosPageRoutingModule
  ],
  declarations: [PuntosVerdesPage]
})
export class PuntosVerdesPageModule {}
