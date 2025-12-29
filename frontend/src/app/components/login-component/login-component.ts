import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api-service';
import { ValidationService } from '../../core/services/validation.service';
import { Login, ApiResponse } from '../../core/models/api-module/api-module-module';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
  credentials: Login = {
    email: '',
    senha: '',
  };

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  mostrarSenha: boolean = false;
  rememberMe: boolean = false;

  private redirectTimeout?: number;

  constructor(
    private apiService: ApiService,
    private validationService: ValidationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadGoogleScript();
    this.checkOAuthCallback();
  }

  ngOnDestroy(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  checkOAuthCallback(): void {
    this.route.queryParams.subscribe(params => {
      if (params['token'] && params['user']) {
        localStorage.setItem('access_token', params['token']);
        
        if (params['new_user'] === 'true') {
          this.successMessage = 'Conta criada com sucesso! Bem-vindo ao sistema';
        } else {
          this.successMessage = 'Login com Google realizado com sucesso!';
        }
        
        this.redirectTimeout = window.setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      }

      if (params['error']) {
        if (params['error'] === 'email_cadastrado_normal') {
          this.errorMessage = 'Este email já possui cadastro normal. Use login tradicional';
        } else if (params['error'] === 'google_auth_failed') {
          this.errorMessage = 'Erro ao autenticar com Google. Tente novamente';
        }
      }
    });
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
        callback: (response: any) => this.handleGoogleLogin(response)
      });

      google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'),
        { 
          theme: 'outline', 
          size: 'large',
          width: 350,
          text: 'signin_with',
          locale: 'pt-BR'
        }
      );
    }
  }

  handleGoogleLogin(response: any): void {
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
            this.successMessage = resposta.message;
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
          this.errorMessage = error.error?.error || 'Este email já possui cadastro normal. Use login tradicional';
        } else if (error.status === 401) {
          this.errorMessage = error.error?.error || 'Token do Google inválido';
        } else if (error.status === 0) {
          this.errorMessage = 'Não foi possível conectar ao servidor';
        } else {
          this.errorMessage = error.error?.error || 'Erro ao fazer login com Google';
        }
      }
    });
  }

  toggleMostrarSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  goToRegister(): void {
    this.router.navigate(['/cadastro']);
  }

  goToForgot(): void {
    this.router.navigate(['/esqueceu']);
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.credentials.email || this.credentials.email.trim() === '') {
      this.errorMessage = 'Email é obrigatório';
      return;
    }

    if (!this.validationService.validarEmail(this.credentials.email)) {
      this.errorMessage = 'Email inválido. Deve conter @ e domínio válido';
      return;
    }

    if (!this.credentials.senha || this.credentials.senha.trim() === '') {
      this.errorMessage = 'Senha é obrigatória';
      return;
    }

    if (this.credentials.senha.length < 6) {
      this.errorMessage = 'Senha deve ter no mínimo 6 caracteres';
      return;
    }

    this.isLoading = true;

    this.apiService.Login(this.credentials).subscribe({
      next: (resposta: ApiResponse) => {
        this.isLoading = false;

        if (resposta.success) {
          this.successMessage = resposta.message;
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
          this.successMessage = '';
        }
      },
      error: (error) => {
        this.isLoading = false;

        if (error.status === 401) {
          this.errorMessage = error.error?.error || 'Email ou senha incorretos';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.error || 'Dados inválidos. Verifique os campos';
        } else if (error.status === 500) {
          this.errorMessage = 'Erro no servidor. Tente novamente mais tarde';
        } else if (error.status === 0) {
          this.errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão';
        } else {
          this.errorMessage = error.error?.error || 'Erro ao fazer login. Tente novamente';
        }

        this.successMessage = '';
      }
    });
  }
}
