import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api-service';
import { ValidationService, SenhaRequisitos } from '../../core/services/validation.service';
import { ResetPassword, ApiResponse } from '../../core/models/api-module/api-module-module';

@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './recuperar-component.html',
  styleUrl: './recuperar-component.scss',
})
export class RecuperarComponent implements OnInit, OnDestroy {
  data: ResetPassword = {
    token: '',
    nova_senha: '',
    confirmar_senha: ''
  };

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  tokenInvalido: boolean = false;
  senhaAlterada: boolean = false;

  mostrarSenha: boolean = false;
  mostrarConfirmarSenha: boolean = false;

  senhaRequisitos: SenhaRequisitos = {
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false
  };

  private redirectTimeout?: number;

  constructor(
    private apiService: ApiService,
    private validationService: ValidationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.data.token = params['token'] || '';
      
      if (!this.data.token) {
        this.tokenInvalido = true;
        this.errorMessage = 'Token de recuperação não encontrado';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  validarSenhaRequisitos(): void {
    this.senhaRequisitos = this.validationService.validarSenha(this.data.nova_senha);
  }

  senhaForte(): boolean {
    return this.validationService.senhaForte(this.data.nova_senha);
  }

  toggleMostrarSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  toggleMostrarConfirmarSenha(): void {
    this.mostrarConfirmarSenha = !this.mostrarConfirmarSenha;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.data.token) {
      this.errorMessage = 'Token inválido. Solicite um novo link';
      return;
    }

    if (!this.data.nova_senha || !this.data.confirmar_senha) {
      this.errorMessage = 'Por favor, preencha ambas as senhas';
      return;
    }

    if (!this.senhaForte()) {
      this.errorMessage = 'A senha não atende aos requisitos mínimos';
      return;
    }

    if (this.data.nova_senha !== this.data.confirmar_senha) {
      this.errorMessage = 'As senhas não conferem';
      return;
    }

    this.isLoading = true;

    this.apiService.recuperar(this.data).subscribe({
      next: (resposta: ApiResponse) => {
        this.isLoading = false;

        if (resposta.success) {
          this.senhaAlterada = true;
          this.successMessage = resposta.message;
          this.errorMessage = '';
          
          this.redirectTimeout = window.setTimeout(() => {
            this.goToLogin();
          }, 3000);
        } else {
          this.errorMessage = resposta.error;
          this.successMessage = '';
        }
      },
      error: (error) => {
        this.isLoading = false;

        if (error.status === 400) {
          const errorMsg = error.error?.error || '';
          
          if (errorMsg.includes('Token inválido')) {
            this.errorMessage = 'Link inválido. Solicite um novo link de recuperação';
          } else if (errorMsg.includes('Token expirado')) {
            this.errorMessage = 'Link expirado. Solicite um novo link de recuperação';
          } else if (errorMsg.includes('não conferem')) {
            this.errorMessage = 'As senhas não conferem';
          } else {
            this.errorMessage = errorMsg || 'Erro ao processar solicitação';
          }
        } else if (error.status === 500) {
          this.errorMessage = 'Erro no servidor. Tente novamente mais tarde';
        } else if (error.status === 0) {
          this.errorMessage = 'Não foi possível conectar ao servidor';
        } else {
          this.errorMessage = 'Erro ao redefinir senha. Tente novamente';
        }

        this.successMessage = '';
      }
    });
  }
}