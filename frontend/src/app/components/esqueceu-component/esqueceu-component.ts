import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api-service';
import { ForgotPassword } from '../../core/models/api-module/api-module-module';
import { Router } from '@angular/router';

@Component({
  selector: 'app-esqueceu-component',
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
  resetLink: string = ''; // Guarda o link de recuperação

  constructor(private apiservice: ApiService, private router: Router) {}

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Validação de email
  validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Método para abrir o link de recuperação (quando o usuário clicar no botão)
  abrirLinkRecuperacao(): void {
    if (this.resetLink) {
      // Extrai apenas o token da URL completa
      const urlObj = new URL(this.resetLink);
      const token = urlObj.searchParams.get('token');
      
      if (token) {
        // Navega para a rota de recuperação COM o token
        this.router.navigate(['/recuperar'], { 
          queryParams: { token: token } 
        });
      }
    }
  }

  onSubmit(): void {
    // Limpa mensagens anteriores
    this.errorMessage = '';
    this.successMessage = '';
    this.resetLink = '';

    // Validação 1: Email obrigatório
    if (!this.data.email || this.data.email.trim() === '') {
      this.errorMessage = 'Email é obrigatório';
      return;
    }

    // Validação 2: Email válido
    if (!this.validarEmail(this.data.email)) {
      this.errorMessage = 'Email inválido. Deve conter @ e domínio válido';
      return;
    }

    // Mostra loading
    this.isLoading = true;

    // Log para debug
    console.log('Dados sendo enviados para o backend:', {
      email: this.data.email
    });

    // Envia para o backend
    this.apiservice.Esqueceu(this.data).subscribe({
      next: (resposta: any) => {  // ← MUDANÇA AQUI: usar 'any' para pegar o reset_link
        this.isLoading = false;
        console.log('Resposta do backend:', resposta);

        if (resposta.success) {
          this.successMessage = resposta.message;
          this.errorMessage = '';

          // ← NOVIDADE: Captura o link se o backend enviar
          if (resposta.reset_link) {
            this.resetLink = resposta.reset_link;
            console.log('✅ Link de recuperação capturado:', this.resetLink);
          } else {
            console.log('⚠️ ATENÇÃO: Verifique o console do Flask backend para obter o link!');
          }
        } else {
          this.errorMessage = resposta.error;
          this.successMessage = '';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erro na requisição:', error);

        // Tratamento de erros específicos
        if (error.status === 400) {
          this.errorMessage = error.error?.error || 'Email inválido';
        } else if (error.status === 500) {
          this.errorMessage = 'Erro no servidor. Tente novamente mais tarde';
        } else if (error.status === 0) {
          this.errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão';
        } else {
          this.errorMessage = 'Erro ao enviar email de recuperação. Tente novamente';
        }

        this.successMessage = '';
      }
    });
  }
}