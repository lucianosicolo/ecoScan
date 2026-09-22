import {
  BrowserModule,
} from '@angular/platform-browser';

import {
  RouteReuseStrategy,
} from '@angular/router';

import {
  registerLocaleData,
} from '@angular/common';

import localeEsAr
  from '@angular/common/locales/es-AR';

import {
  NgModule,
} from '@angular/core';

import {
  IonicModule,
  IonicRouteStrategy,
} from '@ionic/angular';

import {
  HTTP_INTERCEPTORS,
  HttpClientModule,
} from '@angular/common/http';

import {
  AppRoutingModule,
} from './app-routing.module';

import {
  AppComponent,
} from './app.component';

import {
  AuthInterceptor,
} from './auth/interceptors/auth.interceptor';

registerLocaleData(
  localeEsAr,
);

@NgModule({
  declarations: [
    AppComponent,
  ],

  imports: [
    BrowserModule,

    IonicModule.forRoot(),

    AppRoutingModule,

    HttpClientModule,
  ],

  providers: [
    {
      provide:
        RouteReuseStrategy,

      useClass:
        IonicRouteStrategy,
    },

    {
      provide:
        HTTP_INTERCEPTORS,

      useClass:
        AuthInterceptor,

      multi: true,
    },
  ],

  bootstrap: [
    AppComponent,
  ],
})
export class AppModule {}