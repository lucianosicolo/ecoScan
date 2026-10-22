import {
  Injectable,
} from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Observable,
} from 'rxjs';

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  ciudad: string | null;
  createdAt: string;
}

export interface UsersDto {
  nombre?: string;
  apellido?: string;
  email?: string;
  ciudad?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {

  private readonly apiUrl =
    'http://localhost:3000/users';

  constructor(
    private readonly http:
      HttpClient,
  ) {}

  update(
    id: number,
    usersDto: UsersDto,
  ): Observable<User> {

    return this.http.put<User>(
      `${this.apiUrl}/${id}`,
      usersDto,
    );
  }

  remove(
    id: number,
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`,
    );
  }
}
