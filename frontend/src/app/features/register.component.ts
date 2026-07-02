import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'aura-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <section class="auth-panel">
        <div class="brand-mark">AURA</div>
        <h1>Create your workspace identity</h1>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Name <input formControlName="name" /></label>
          <label>Avatar URL <input formControlName="avatar" /></label>
          <label>Email <input formControlName="email" type="email" /></label>
          <label>Password <input formControlName="password" type="password" /></label>
          <label>Confirm Password <input formControlName="confirmPassword" type="password" /></label>
          <p class="form-error" *ngIf="error">{{ error }}</p>
          <button type="submit" [disabled]="form.invalid">Register</button>
        </form>
        <p>Already registered? <a routerLink="/login">Log in</a></p>
      </section>
    </main>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  error='';
  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    avatar: [''],
    email: ['', [Validators.email, Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  submit() {
  console.log("Submit clicked");

  this.error = '';

  const body = this.form.getRawValue();

  console.log(body);

  if (body.password !== body.confirmPassword) {
    this.error = 'Password and confirm password must match.';
    return;
  }

  if (this.form.invalid) {
    this.error = 'Form invalid';
    console.log(this.form.errors);
    console.log(this.form.status);
    return;
  }

  console.log("Calling API...");

  this.api.register(body).subscribe({
    next: (session) => {
      console.log("Success", session);

      localStorage.setItem('aura.accessToken', session.accessToken);
      localStorage.setItem('aura.refreshToken', session.refreshToken);

      this.router.navigateByUrl('/');
    },
    error: (err) => {
      console.log("API ERROR");
      console.log(err);

      this.error =
        err?.error?.message ||
        err?.error?.errors?.[0]?.msg ||
        'Registration failed';
    }
  });
}
}
