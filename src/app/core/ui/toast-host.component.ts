import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-host" role="status" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div
          class="toast"
          [class.toast-info]="t.level === 'info'"
          [class.toast-success]="t.level === 'success'"
          [class.toast-error]="t.level === 'error'"
          (click)="toast.dismiss(t.id)"
        >
          {{ t.message }}
        </div>
      }
    </div>
  `,
  styles: [
    `.toast-host {
      position: fixed;
      top: 16px;
      right: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 1000;
      pointer-events: none;
    }`,
    `.toast {
      pointer-events: auto;
      min-width: 240px;
      max-width: 380px;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #0f172a;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
      cursor: pointer;
      font-size: 14px;
      animation: toast-in 160ms ease-out;
    }`,
    `.toast-info { border-color: #bfdbfe; background: #eff6ff; color: #1e3a8a; }`,
    `.toast-success { border-color: #bbf7d0; background: #ecfdf5; color: #166534; }`,
    `.toast-error { border-color: #fecaca; background: #fef2f2; color: #991b1b; }`,
    `@keyframes toast-in {
       from { transform: translateY(-8px); opacity: 0; }
       to { transform: translateY(0); opacity: 1; }
     }`,
  ],
})
export class ToastHostComponent {
  protected readonly toast = inject(ToastService);
}
