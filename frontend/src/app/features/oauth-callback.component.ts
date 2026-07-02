import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  standalone: true,
  template: `<p>Signing in...</p>`
})
export class OAuthCallbackComponent {

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {

    const accessToken =
      this.route.snapshot.queryParamMap.get('accessToken');

    const refreshToken =
      this.route.snapshot.queryParamMap.get('refreshToken');

    if (accessToken) {
      localStorage.setItem('aura.accessToken', accessToken);
    }

    if (refreshToken) {
      localStorage.setItem('aura.refreshToken', refreshToken);
    }

    this.router.navigateByUrl('/');
  }
}