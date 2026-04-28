import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="login">
      <h1>Devops Hub</h1>
      <div class="tabs">
        <button type="button" [class.active]="mode() === 'login'" (click)="mode.set('login')">Login</button>
        <button type="button" [class.active]="mode() === 'register'" (click)="mode.set('register')">Register</button>
      </div>
      <form (submit)="submit($event)">
        @if (mode() === 'register') {
          <label>Tenant name <input name="tenantName" [(ngModel)]="tenantName" required /></label>
          <label>Tenant slug <input name="tenantSlug" [(ngModel)]="tenantSlug" required /></label>
        }
        <label>Email <input name="email" type="email" [(ngModel)]="email" required /></label>
        <label>Password <input name="password" type="password" [(ngModel)]="password" required /></label>
        <button type="submit" class="primary" [disabled]="busy()">
          {{ mode() === 'login' ? 'Sign in' : 'Create account' }}
        </button>
        @if (error()) { <p class="err">{{ error() }}</p> }
      </form>
    </div>
  `,
  styles: [
    `.login { max-width: 360px; margin: 48px auto; padding: 24px; border: 1px solid #e2e8f0;
             border-radius: 8px; background: #fff; }`,
    `.tabs { display: flex; gap: 8px; margin-bottom: 16px; }`,
    `.tabs button { flex: 1; padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc;
                    border-radius: 6px; cursor: pointer; }`,
    `.tabs button.active { background: #2563eb; color: #fff; border-color: #2563eb; }`,
    `form { display: flex; flex-direction: column; gap: 10px; }`,
    `label { display: flex; flex-direction: column; font-size: 13px; color: #475569; gap: 4px; }`,
    `input { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font: inherit; }`,
    `button.primary { background: #2563eb; color: #fff; border: none; padding: 10px;
                      border-radius: 6px; cursor: pointer; font-weight: 600; }`,
    `.err { color: #b91c1c; margin: 8px 0 0; font-size: 13px; }`,
  ],
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = signal<'login' | 'register'>('login');
  readonly busy = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  email = '';
  password = '';
  tenantName = '';
  tenantSlug = '';

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    this.busy.set(true);
    this.error.set(null);
    try {
      if (this.mode() === 'login') {
        await this.auth.login({ email: this.email, password: this.password });
      } else {
        await this.auth.register({
          email: this.email,
          password: this.password,
          tenantName: this.tenantName,
          tenantSlug: this.tenantSlug,
        });
      }
      await this.router.navigateByUrl('/pipelines');
    } catch (err: any) {
      this.error.set(err?.error?.message ?? err?.message ?? 'Authentication failed');
    } finally {
      this.busy.set(false);
    }
  }
}
