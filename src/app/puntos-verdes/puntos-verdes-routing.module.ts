import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PuntosVerdesPage } from './puntos-verdes.page';


const routes: Routes = [
  {
    path: '',
    component: PuntosVerdesPage
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class PagosPageRoutingModule {}