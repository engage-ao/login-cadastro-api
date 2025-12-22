import { Routes } from '@angular/router';
import { LoginComponent } from './components/login-component/login-component';
import { CadastroComponent } from './components/cadastro-component/cadastro-component';
import { EsqueceuComponent } from './components/esqueceu-component/esqueceu-component';
import { RecuperarComponent } from './components/recuperar-component/recuperar-component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
    {path: 'login', component: LoginComponent},

    {
        path: 'cadastro',
        component: CadastroComponent
    },

    {path: 'esqueceu', component: EsqueceuComponent},

    {path: 'recuperar', component: RecuperarComponent}
];
