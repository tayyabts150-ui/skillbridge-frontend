import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiResponse, AuthData, Token } from './interface';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  protected readonly http = inject(HttpClient);

  login(email: string, password: string, rememberMe = false) {
    return this.http.post<ApiResponse<AuthData>>('/api/Auth/login', {
      email,
      password,
      rememberMe,
    });
  }

  register(params: any) {
    return this.http.post<ApiResponse<AuthData>>('/api/Auth/register', params);
  }

  refresh(params: Record<string, any>) {
    return this.http.post<Token>('/api/Auth/refresh', params);
  }

  logout() {
    return this.http.post<any>('/api/Auth/logout', {});
  }

  getUser() {
    return this.http.get<ApiResponse<AuthData>>(`/api/Auth/me`);
  }

  getEducationLevels() {
    return this.http.get<ApiResponse<any>>('/api/Auth/education-level');
  }
}
