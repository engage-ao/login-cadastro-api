import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api-service';
import { ResetPassword } from '../../core/models/api-module/api-module-module';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-recuperar-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './recuperar-component.html',
  styleUrl: './recuperar-component.scss',
})
export class RecuperarComponent implements OnInit {
  token: string = '';

  data: ResetPassword = {
    nova_senha: '',
    confirmar_senha: '',
    token: '',
  };

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  tokenValido: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private apiservice: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Captura o token da URL
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    // Verifica se o token existe
    if (!this.token) {
      this.tokenValido = false;
      this.errorMessage = 'Token não encontrado. Solicite um novo link de recuperação.';
    } else {
      this.data.token = this.token;
      console.log('Token capturado da URL:', this.token);
    }
  }

  // Validação de senha forte
  validarSenha(senha: string): { valida: boolean; mensagem: string } {
    if (senha.length < 6) {
      return { valida: false, mensagem: 'A senha deve ter no mínimo 6 caracteres' };
    }
    return { valida: true, mensagem: '' };
  }

  // ADICIONE ESTE MÉTODO PÚBLICO
  voltarParaLogin(): void {
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    // Limpa mensagens anteriores
    this.errorMessage = '';
    this.successMessage = '';

    // Validação 0: Token válido
    if (!this.tokenValido || !this.token) {
      this.errorMessage = 'Token inválido. Solicite um novo link de recuperação.';
      return;
    }

    // Validação 1: Nova senha obrigatória
    if (!this.data.nova_senha || this.data.nova_senha.trim() === '') {
      this.errorMessage = 'Nova senha é obrigatória';
      return;
    }

    // Validação 2: Validar força da senha
    const validacaoSenha = this.validarSenha(this.data.nova_senha);
    if (!validacaoSenha.valida) {
      this.errorMessage = validacaoSenha.mensagem;
      return;
    }

    // Validação 3: Confirmar senha obrigatória
    if (!this.data.confirmar_senha || this.data.confirmar_senha.trim() === '') {
      this.errorMessage = 'Confirmação de senha é obrigatória';
      return;
    }

    // Validação 4: Senhas conferem
    if (this.data.nova_senha !== this.data.confirmar_senha) {
      this.errorMessage = 'As senhas não conferem';
      return;
    }

    // Mostra loading
    this.isLoading = true;

    // Log para debug
    console.log('Dados sendo enviados para o backend:', {
      token: this.token,
      nova_senha: '***',
      confirmar_senha: '***'
    });

    // Prepara os dados com o token correto
    const dadosEnvio: ResetPassword = {
      nova_senha: this.data.nova_senha,
      confirmar_senha: this.data.confirmar_senha,
      token: this.token
    };

    // Envia para o backend
    this.apiservice.recuperar(dadosEnvio).subscribe({
      next: (resposta) => {
        this.isLoading = false;
        console.log('Resposta do backend:', resposta);

        if (resposta.success) {
          this.successMessage = resposta.message;
          this.errorMessage = '';

          // Limpa os campos
          this.data.nova_senha = '';
          this.data.confirmar_senha = '';

          // Redireciona para login após 3 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        } else {
          this.errorMessage = resposta.error;
          this.successMessage = '';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erro na requisição:', error);

        // Tratamento de erros específicos do backend
        if (error.status === 400) {
          this.errorMessage = error.error?.error || 'Token inválido ou expirado. Solicite um novo link';
        } else if (error.status === 500) {
          this.errorMessage = 'Erro no servidor. Tente novamente mais tarde';
        } else if (error.status === 0) {
          this.errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão';
        } else {
          this.errorMessage = 'Erro ao recuperar senha. Tente novamente';
        }

        this.successMessage = '';
      }
    });
  }

  // Método para solicitar novo link
  solicitarNovoLink(): void {
    this.router.navigate(['/esqueceu']);
  }
}