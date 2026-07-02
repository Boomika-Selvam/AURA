import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'aura-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <section class="auth-panel">
        <div class="brand-mark">AURA</div>
        <h1>Welcome back</h1>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Email <input formControlName="email" type="email" /></label>
          <label>Password <input formControlName="password" type="password" /></label>
          <button type="submit" [disabled]="form.invalid">Log in</button>
          <a class="google" href="https://aura-ljpr.onrender.com/api/auth/google">Continue with Google</a>
        </form>
        <p>New to AURA? <a routerLink="/register">Create an account</a></p>
      </section>
    </main>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  form = this.fb.nonNullable.group({ email: ['', [Validators.email, Validators.required]], password: ['', Validators.required] });

  submit() {
    if (this.form.invalid) return;
    this.api.login(this.form.getRawValue()).subscribe((session) => {
      localStorage.setItem('aura.accessToken', session.accessToken);
      localStorage.setItem('aura.refreshToken', session.refreshToken);
      this.router.navigateByUrl('/');
    });
  }
}
