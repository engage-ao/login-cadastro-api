import { Injectable } from '@angular/core';

export interface SenhaRequisitos {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  
  validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validarSenha(senha: string): SenhaRequisitos {
    return {
      minLength: senha.length >= 6,
      hasUpper: /[A-Z]/.test(senha),
      hasLower: /[a-z]/.test(senha),
      hasNumber: /[0-9]/.test(senha)
    };
  }

  senhaForte(senha: string): boolean {
    const requisitos = this.validarSenha(senha);
    return Object.values(requisitos).every(req => req);
  }
}

