import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface User {
  id: number;
  nome: string;
  email: string;
  is_google_user?: boolean;
  picture?: string;
  google_id?: string;
}

export interface Register {
  nome: string;
  email: string;
  senha: string;
  confirmar_senha: string;
}

export interface Login {
  email: string;
  senha: string;
}

export interface GoogleLoginRequest {
  token: string;
}

export interface ForgotPassword {
  email: string;
}

export interface ResetPassword {
  nova_senha: string;
  confirmar_senha: string;
  token: string;
}


export interface ApiResponseSuccess {
  success: true;
  message: string;
  access_token?: string;
  usuario?: User;
  is_new_user?: boolean;
}

export interface ApiResponseError {
  success: false;
  error: string;
}

export type ApiResponse = ApiResponseSuccess | ApiResponseError;

@NgModule({
  declarations: [],
  imports: [CommonModule]
})
export class ApiModuleModule {}