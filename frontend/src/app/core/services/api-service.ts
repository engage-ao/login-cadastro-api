import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, ApiResponse, Register,Login,ResetPassword,ForgotPassword } from '../models/api-module/api-module-module';

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  private apiUrl = "http://127.0.0.1:5000";

  constructor(private http: HttpClient){}

  Cadastro(user: Register): Observable<ApiResponse>{
    return this.http.post<ApiResponse>(`${this.apiUrl}/cadastrar`, user);
  }

  Login(credentials: Login): Observable<ApiResponse>{
    return this.http.post<ApiResponse>(`${this.apiUrl}/login`, credentials);
  }

  Esqueceu(email: ForgotPassword): Observable<ApiResponse>{
    return this.http.post<ApiResponse>(`${this.apiUrl}/esqueceuSenha`, email);
  }

  recuperar(data: ResetPassword): Observable<ApiResponse>{
    return this.http.post<ApiResponse>(`${this.apiUrl}/recuperarSenha`, data)
  }
  
}
