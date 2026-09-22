import {
  Injectable,
} from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Observable,
} from 'rxjs';

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  ciudad?: string;
}

export interface AuthUser {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  ciudad: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly apiUrl =
    'http://localhost:3000/auth';

  constructor(
    private readonly http:
      HttpClient,
  ) {}

  register(
    request: RegisterRequest,
  ): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/register`,
      request,
    );
  }

  login(
    email: string,
    password: string,
  ): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      {
        email,
        password,
      },
    );
  }

  saveSession(
    response: AuthResponse,
  ): void {

    localStorage.setItem(
      'ecoScan-token',
      response.accessToken,
    );

    localStorage.setItem(
      'ecoScan-user',
      JSON.stringify(
        response.user,
      ),
    );
  }

  getToken():
    string | null {

    return localStorage.getItem(
      'ecoScan-token',
    );
  }

  getUser():
    AuthUser | null {

    const storedUser =
      localStorage.getItem(
        'ecoScan-user',
      );

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(
        storedUser,
      ) as AuthUser;
    } catch {
      return null;
    }
  }

  logout(): void {

    localStorage.removeItem(
      'ecoScan-token',
    );

    localStorage.removeItem(
      'ecoScan-user',
    );

    localStorage.removeItem(
      'ecoScan-session',
    );
  }

  isAuthenticated(): boolean {

    return Boolean(
      this.getToken(),
    );
  }
}