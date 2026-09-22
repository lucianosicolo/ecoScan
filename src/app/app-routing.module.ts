import { NgModule } from '@angular/core';
import {
  PreloadAllModules,
  RouterModule,
  Routes
} from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./auth/login/login.module')
        .then(m => m.LoginPageModule)
  },
  {
    path: 'registro',
    loadChildren: () =>
      import('./auth/registro/registro.module')
        .then(
          module =>
            module.RegistroPageModule,
        ),
  },
  {
    path: 'app',

    canActivate: [
      AuthGuard,
    ],

    loadChildren: () =>
      import(
        './layout/layout.module'
      )
        .then(
          m =>
            m.LayoutPageModule,
        ),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  },





];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
      useHash: true
    })
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }