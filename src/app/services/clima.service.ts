import { Injectable } from '@angular/core';

// API REST -> utiliza HTTP para un cliente
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ClimaService {
  private apiKey = '508f014d2b6d53f44705c488d4abfd4d';

  private baseUrl = 'https://api.openweathermap.org/data/2.5/weather';

  constructor(private http: HttpClient) { }

  getClima(city: string = 'Cipolletti,AR'){
    const url = `${this.baseUrl}?q=${city}&appid=${this.apiKey}&units=metric&lang=es`;

    return this.http.get(url);
  }
}
