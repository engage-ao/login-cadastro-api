import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api-service';
import { Login } from '../../core/models/api-module/api-module-module';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.scss',
})
export class LoginComponent {
  credentials: Login = {
    email: '',
    senha: '',
  };

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  rememberMe: boolean = false;

  constructor(private apiService: ApiService, private router: Router) {}

  goToRegister(): void {
    this.router.navigate(['/cadastro']);
  }

  goToForgot(): void {
    this.router.navigate(['/esqueceu']);
  }

  // Validação de email
  validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSubmit(): void {
    // Limpa mensagens anteriores
    this.errorMessage = '';
    this.successMessage = '';

    // Validação 1: Email obrigatório
    if (!this.credentials.email || this.credentials.email.trim() === '') {
      this.errorMessage = 'Email é obrigatório';
      return;
    }

    // Validação 2: Email válido
    if (!this.validarEmail(this.credentials.email)) {
      this.errorMessage = 'Email inválido. Deve conter @ e domínio válido';
      return;
    }

    // Validação 3: Senha obrigatória
    if (!this.credentials.senha || this.credentials.senha.trim() === '') {
      this.errorMessage = 'Senha é obrigatória';
      return;
    }

    // Validação 4: Senha mínima
    if (this.credentials.senha.length < 6) {
      this.errorMessage = 'Senha deve ter no mínimo 6 caracteres';
      return;
    }

    // Mostra loading
    this.isLoading = true;

    // Log para debug - verificar se os dados estão corretos
    console.log('Dados sendo enviados para o backend:', {
      email: this.credentials.email,
      senha: '***' // Não mostra a senha no console por segurança
    });

    // Envia para o backend
    this.apiService.Login(this.credentials).subscribe({
      next: (resposta) => {
        this.isLoading = false;
        console.log('Resposta do backend:', resposta);

        if (resposta.success) {
          this.successMessage = resposta.message;
          this.errorMessage = '';

          // Armazena o token (se houver)
          if ('access_token' in resposta) {
            localStorage.setItem('access_token', (resposta as any).access_token);
            
            // Armazena dados do usuário (se houver)
            if ('usuario' in resposta) {
              localStorage.setItem('user', JSON.stringify((resposta as any).usuario));
            }
          }

          // Redireciona para dashboard após 1.5 segundos
          setTimeout(() => {
            this.router.navigate(['/dashboard']); // Ajuste para sua rota principal
          }, 1500);
        } else {
          this.errorMessage = resposta.error;
          this.successMessage = '';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erro na requisição:', error);

        // Tratamento de erros específicos do backend
        if (error.status === 401) {
          this.errorMessage = 'Email ou senha incorretos';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.error || 'Dados inválidos. Verifique os campos';
        } else if (error.status === 500) {
          this.errorMessage = 'Erro no servidor. Tente novamente mais tarde';
        } else if (error.status === 0) {
          this.errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão';
        } else {
          this.errorMessage = 'Erro ao fazer login. Tente novamente';
        }

        this.successMessage = '';
      }
    });
  }
}