import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api-service';
import { ValidationService } from '../../core/services/validation.service';
import { ForgotPassword, ApiResponse } from '../../core/models/api-module/api-module-module';

@Component({
  selector: 'app-esqueceu',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './esqueceu-component.html',
  styleUrl: './esqueceu-component.scss',
})
export class EsqueceuComponent {
  data: ForgotPassword = {
    email: '',
  };

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  emailEnviado: boolean = false;

  constructor(
    private apiService: ApiService,
    private validationService: ValidationService,
    private router: Router
  ) {}

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  reenviarEmail(): void {
    this.emailEnviado = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.emailEnviado = false;

    if (!this.data.email || this.data.email.trim() === '') {
      this.errorMessage = 'Email é obrigatório';
      return;
    }

    if (!this.validationService.validarEmail(this.data.email)) {
      this.errorMessage = 'Email inválido. Deve conter @ e domínio válido';
      return;
    }

    this.isLoading = true;

    this.apiService.Esqueceu(this.data).subscribe({
      next: (resposta: ApiResponse) => {
        this.isLoading = false;

        if (resposta.success) {
          this.emailEnviado = true;
          this.successMessage = resposta.message;
          this.errorMessage = '';
        } else {
          this.errorMessage = resposta.error;
          this.successMessage = '';
        }
      },
      error: (error) => {
        this.isLoading = false;

        if (error.status === 400) {
          this.errorMessage = error.error?.error || 'Email inválido';
        } else if (error.status === 500) {
          this.errorMessage = 'Erro ao enviar email. Tente novamente';
        } else if (error.status === 0) {
          this.errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão';
        } else {
          this.errorMessage = 'Erro ao processar solicitação. Tente novamente';
        }

        this.successMessage = '';
      }
    });
  }
}