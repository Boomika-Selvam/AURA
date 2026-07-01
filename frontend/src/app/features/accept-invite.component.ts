import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'aura-accept-invite',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <section class="auth-panel">
        <div class="brand-mark">AURA</div>

        <ng-container *ngIf="loading()">
          <p>Checking your invite…</p>
        </ng-container>

        <ng-container *ngIf="!loading() && loadError()">
          <h1>Invite not available</h1>
          <p>{{ loadError() }}</p>
          <p><a routerLink="/login">Back to login</a></p>
        </ng-container>

        <ng-container *ngIf="!loading() && !loadError()">
          <h1>You're invited{{ teamName() ? ' to ' + teamName() : '' }}</h1>
          <p>{{ invitedBy() || 'A teammate' }} invited <strong>{{ email() }}</strong> to join AURA.</p>

          <form (ngSubmit)="submit()">
            <label *ngIf="!hasAccount()">Your name
              <input [(ngModel)]="name" name="name" placeholder="Full name" />
            </label>
            <label>{{ hasAccount() ? 'Password (this account already exists)' : 'Create a password' }}
              <input [(ngModel)]="password" name="password" type="password" />
            </label>
            <p class="error" *ngIf="submitError()">{{ submitError() }}</p>
            <button type="submit" [disabled]="submitting() || !password.trim() || (!hasAccount() && !name.trim())">
              {{ submitting() ? 'Joining…' : (hasAccount() ? 'Log in and join' : 'Create account and join') }}
            </button>
          </form>
        </ng-container>
      </section>
    </main>
  `
})
export class AcceptInviteComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly hasAccount = signal(false);
  readonly email = signal('');
  readonly teamName = signal('');
  readonly invitedBy = signal('');
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  private token = '';
  name = '';
  password = '';

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.loading.set(false);
      this.loadError.set('This invite link is missing a token. Ask the person who invited you to resend it.');
      return;
    }

    this.api.getInvite(this.token).subscribe({
      next: (info) => {
        this.loading.set(false);
        this.email.set(info.email);
        this.teamName.set(info.team?.name || '');
        this.invitedBy.set(info.invitedBy || '');
        this.hasAccount.set(info.hasAccount);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(err?.error?.message || 'This invite link is invalid or has expired.');
      }
    });
  }

  submit() {
    if (!this.password.trim()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    this.api.acceptInvite(this.token, { name: this.name.trim() || undefined, password: this.password }).subscribe({
      next: (session) => {
        localStorage.setItem('aura.accessToken', session.accessToken);
        localStorage.setItem('aura.refreshToken', session.refreshToken);
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(err?.error?.message || 'Could not accept this invite. Please try again.');
      }
    });
  }
}
