import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api-service';
import { ValidationService, SenhaRequisitos } from '../../core/services/validation.service';
import { Register, ApiResponse } from '../../core/models/api-module/api-module-module';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro-component.html',
  styleUrl: './cadastro-component.scss',
})
export class CadastroComponent implements OnInit, OnDestroy {
  user: Register = {
    nome: '',
    email: '',
    senha: '',
    confirmar_senha: '',
  };

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadGoogleScript();
  }

  ngOnDestroy(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }



  loadGoogleScript(): void {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      this.initializeGoogleSignIn();
    };
  }

  initializeGoogleSignIn(): void {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => this.handleGoogleSignup(response)
      });

      google.accounts.id.renderButton(
        document.getElementById('googleSignUpButton'),
        { 
          theme: 'outline', 
          size: 'large',
          width: 350,
          text: 'signup_with',
          locale: 'pt-BR'
        }
      );
    }
  }

  handleGoogleSignup(response: any): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.GoogleLogin({ token: response.credential }).subscribe({
      next: (resposta: ApiResponse) => {
        this.isLoading = false;

        if (resposta.success) {
         
          if (resposta.is_new_user) {
            this.successMessage = 'Conta criada com sucesso! Bem-vindo ao sistema';
          } else {
            this.successMessage = 'Login realizado com sucesso!';
          }
          
          this.errorMessage = '';

        
          if (resposta.access_token) {
            localStorage.setItem('access_token', resposta.access_token);
            
            if (resposta.usuario) {
              localStorage.setItem('user', JSON.stringify(resposta.usuario));
            }
          }

          
          this.redirectTimeout = window.setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        } else {
          this.errorMessage = resposta.error;
        }
      },
      error: (error) => {
        this.isLoading = false;

        
        if (error.status === 409) {
          const errorMsg = error.error?.error || '';
          if (errorMsg.includes('normal') || errorMsg.includes('cadastro normal')) {
            this.errorMessage = 'Este email já possui cadastro normal. Use login tradicional';
          } else {
            this.errorMessage = 'Este email já está cadastrado';
          }
        } else if (error.status === 401) {
          this.errorMessage = error.error?.error || 'Token do Google inválido';
        } else if (error.status === 0) {
          this.errorMessage = 'Não foi possível conectar ao servidor';
        } else {
          this.errorMessage = error.error?.error || 'Erro ao cadastrar com Google';
        }
      }
    });
  }

 

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    //  Validação 1: Nome obrigatório
    if (!this.user.nome || this.user.nome.trim() === '') {
      this.errorMessage = 'Nome é obrigatório';
      return;
    }

    //  Validação 2: Nome mínimo 3 caracteres
    if (this.user.nome.trim().length < 3) {
      this.errorMessage = 'Nome deve ter no mínimo 3 caracteres';
      return;
    }

    //  Validação 3: Email obrigatório
    if (!this.user.email || this.user.email.trim() === '') {
      this.errorMessage = 'Email é obrigatório';
      return;
    }

    //  Validação 4: Email válido
    if (!this.validationService.validarEmail(this.user.email)) {
      this.errorMessage = 'Email inválido. Deve conter @ e domínio válido';
      return;
    }

    //  Validação 5: Senha obrigatória
    if (!this.user.senha) {
      this.errorMessage = 'Senha é obrigatória';
      return;
    }

    //  Validação 6: Senha forte (6+ chars, maiúscula, minúscula, número)
    if (!this.senhaForte()) {
      this.errorMessage = 'A senha não atende aos requisitos mínimos';
      return;
    }

    //  Validação 7: Confirmação obrigatória
    if (!this.user.confirmar_senha) {
      this.errorMessage = 'Confirmação de senha é obrigatória';
      return;
    }

    //  Validação 8: Senhas conferem
    if (this.user.senha !== this.user.confirmar_senha) {
      this.errorMessage = 'As senhas não conferem';
      return;
    }

    this.isLoading = true;

    //  Chama API de cadastro
    this.apiService.Cadastro(this.user).subscribe({
      next: (resposta: ApiResponse) => {
        this.isLoading = false;
        
        if (resposta.success) {
          this.successMessage = resposta.message;
          this.errorMessage = '';
          
          
          this.user = {
            nome: '',
            email: '',
            senha: '',
            confirmar_senha: '',
          };

          
          this.senhaRequisitos = {
            minLength: false,
            hasUpper: false,
            hasLower: false,
            hasNumber: false
          };
          
          
          this.redirectTimeout = window.setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage = resposta.error;
          this.successMessage = '';
        }
      },
      error: (error) => {
        this.isLoading = false;
        
        
        if (error.status === 409) {
          this.errorMessage = error.error?.error || 'Este email já está cadastrado';
        } else if (error.status === 400) {
          
          this.errorMessage = error.error?.error || 'Dados inválidos. Verifique os campos';
        } else if (error.status === 500) {
          this.errorMessage = 'Erro no servidor. Tente novamente mais tarde';
        } else if (error.status === 0) {
         
          this.errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão';
        } else {
          this.errorMessage = error.error?.error || 'Erro ao realizar o cadastro. Tente novamente';
        }
        
        this.successMessage = '';
      }
    });
  }



  toggleMostrarSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  toggleMostrarConfirmarSenha(): void {
    this.mostrarConfirmarSenha = !this.mostrarConfirmarSenha;
  }

  validarSenhaRequisitos(): void {
    this.senhaRequisitos = this.validationService.validarSenha(this.user.senha);
  }

  senhaForte(): boolean {
    return this.validationService.senhaForte(this.user.senha);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}