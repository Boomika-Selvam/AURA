import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Routes } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { AppComponent } from './app/app.component';
import { authGuard } from './app/core/auth.guard';
import { authInterceptor } from './app/core/auth.interceptor';
import { appReducer } from './app/state/app.reducer';

const routes: Routes = [
  { path: 'login', loadComponent: () => import('./app/features/login.component').then((m) => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./app/features/register.component').then((m) => m.RegisterComponent) },
  { path: 'accept-invite', loadComponent: () => import('./app/features/accept-invite.component').then((m) => m.AcceptInviteComponent) },
  { path: 'oauth/callback',loadComponent: () => import('./app/features/oauth-callback.component').then(m => m.OAuthCallbackComponent) },
  { path: '', loadComponent: () => import('./app/shell.component').then((m) => m.ShellComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({ app: appReducer })
  ]
}).catch((error) => console.error(error));
