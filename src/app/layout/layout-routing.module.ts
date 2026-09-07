import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LayoutPage } from './layout.page';

const routes: Routes = [
  {
    path: '',
    component: LayoutPage,
    children: [
      {
        path: 'home',
        loadChildren: () =>
          import('../home/home.module')
            .then(m => m.HomePageModule)
      },
     
      {
        path: 'puntos-verdes',
        loadChildren: () =>
          import('../puntos-verdes/puntos-verdes.module')
            .then(m => m.PuntosVerdesPageModule)
      },
      
      {
        path: 'perfil',
        loadChildren: () =>
          import('../perfil/perfil.module')
            .then(m => m.PerfilPageModule)
      },
       {
        path: 'historial',
        loadChildren: () =>
          import('../historial/historial.module')
            .then(m => m.HistorialPageModule)
      },
     
    
    
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
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
export class LayoutPageRoutingModule { }