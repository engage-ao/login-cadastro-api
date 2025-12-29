import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'
import { 
  ApiResponse, 
  Register, 
  Login, 
  ResetPassword, 
  ForgotPassword,
  GoogleLoginRequest 
} from '../models/api-module/api-module-module';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // Usando environment
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  Cadastro(user: Register): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/cadastrar`, user);
  }

  Login(credentials: Login): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/login`, credentials);
  }

  GoogleLogin(googleToken: GoogleLoginRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/google-login`, googleToken);
  }

  GoogleOAuthRedirect(): void {
    window.location.href = `${this.apiUrl}/auth/google`;
  }

  Esqueceu(email: ForgotPassword): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/esqueceuSenha`, email);
  }

  recuperar(data: ResetPassword): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/recuperarSenha`, data);
  }
}