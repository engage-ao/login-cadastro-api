import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api-service';
import { Register } from '../../core/models/api-module/api-module-module';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cadastro-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro-component.html',
  styleUrl: './cadastro-component.scss',
})
export class CadastroComponent {
  user: Register = {
    nome: '',
    email: '',
    senha: '',
    confirmar_senha: '',
  };

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(private apiservice: ApiService, private router: Router) {}

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Validação de email
  validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validação de senha forte (opcional, mas recomendado)
  validarSenha(senha: string): { valida: boolean; mensagem: string } {
    if (senha.length < 6) {
      return { valida: false, mensagem: 'A senha deve ter no mínimo 6 caracteres' };
    }
    return { valida: true, mensagem: '' };
  }

  onSubmit(): void {
    // Limpa mensagens anteriores
    this.errorMessage = '';
    this.successMessage = '';

    // Validação 1: Nome obrigatório
    if (!this.user.nome || this.user.nome.trim() === '') {
      this.errorMessage = 'Nome é obrigatório';
      return;
    }

    // Validação 2: Nome muito curto
    if (this.user.nome.trim().length < 3) {
      this.errorMessage = 'Nome deve ter no mínimo 3 caracteres';
      return;
    }

    // Validação 3: Email obrigatório
    if (!this.user.email || this.user.email.trim() === '') {
      this.errorMessage = 'Email é obrigatório';
      return;
    }

    // Validação 4: Email válido
    if (!this.validarEmail(this.user.email)) {
      this.errorMessage = 'Email inválido. Deve conter @ e domínio válido';
      return;
    }

    // Validação 5: Senha obrigatória
    if (!this.user.senha) {
      this.errorMessage = 'Senha é obrigatória';
      return;
    }

    // Validação 6: Senha forte
    const validacaoSenha = this.validarSenha(this.user.senha);
    if (!validacaoSenha.valida) {
      this.errorMessage = validacaoSenha.mensagem;
      return;
    }

    // Validação 7: Confirmar senha obrigatória
    if (!this.user.confirmar_senha) {
      this.errorMessage = 'Confirmação de senha é obrigatória';
      return;
    }

    // Validação 8: Senhas conferem
    if (this.user.senha !== this.user.confirmar_senha) {
      this.errorMessage = 'As senhas não conferem';
      return;
    }

    // Mostra loading
    this.isLoading = true;

    // Log para debug - verificar se os dados estão corretos
    console.log('Dados sendo enviados para o backend:', {
      nome: this.user.nome,
      email: this.user.email,
      senha: '***', // Não mostra a senha no console por segurança
      confirmar_senha: '***'
    });

    // Envia para o backend
    this.apiservice.Cadastro(this.user).subscribe({
      next: (resposta) => {
        this.isLoading = false;
        console.log('Resposta do backend:', resposta);
        
        if (resposta.success) {
          this.successMessage = resposta.message;
          this.errorMessage = '';
          
          // Limpa o formulário
          this.user = {
            nome: '',
            email: '',
            senha: '',
            confirmar_senha: '',
          };
          
          // Redireciona para login após 2 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage = resposta.error;
          this.successMessage = '';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erro na requisição:', error);
        
        // Tratamento de erros específicos do backend
        if (error.status === 409) {
          this.errorMessage = 'Este email já está cadastrado';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.error || 'Dados inválidos. Verifique os campos';
        } else if (error.status === 500) {
          this.errorMessage = 'Erro no servidor. Tente novamente mais tarde';
        } else if (error.status === 0) {
          this.errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão';
        } else {
          this.errorMessage = 'Erro ao realizar o cadastro. Tente novamente';
        }
        
        this.successMessage = '';
      }
    });
  }
}