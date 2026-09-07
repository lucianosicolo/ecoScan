import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { NgModule } from '@angular/core';
import {
  IonicModule,
  IonicRouteStrategy
} from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {
  HttpClientModule,
  provideHttpClient
} from '@angular/common/http';

registerLocaleData(localeEsAr);

@NgModule({
  declarations: [
    AppComponent
  ],

  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule
  ],

  providers: [
    provideHttpClient(),

    {
      provide: RouteReuseStrategy,
      useClass: IonicRouteStrategy
    }
  ],

  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }