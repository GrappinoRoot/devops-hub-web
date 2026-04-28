import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { UiSchemaEnvelope } from '@devops-hub/contracts';
import { UiSchemaService } from '../../core/ui/ui-schema.service';
import { UiEventBusService } from '../../core/ui/ui-event-bus.service';
import { UiNodeRendererComponent } from '../../renderer/ui-node-renderer.component';

@Component({
  selector: 'app-integrations-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiNodeRendererComponent],
  providers: [UiEventBusService],
  template: `
    @if (toast(); as t) {
      <div class="toast" [class.toast-error]="t.kind === 'error'">
        {{ t.message }}
      </div>
    }
    @if (schema(); as s) {
      <ui-node [node]="s.root" />
    } @else if (error()) {
      <p class="error">Failed to load view: {{ error() }}</p>
    } @else {
      <p class="loading">Loading view…</p>
    }
  `,
  styles: [
    `:host { display: block; }`,
    `.loading, .error { padding: 24px; color: #64748b; }`,
    `.error { color: #b91c1c; }`,
    `.toast {
      margin: 16px 20px 0;
      padding: 10px 14px;
      border-radius: 8px;
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }`,
    `.toast-error { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }`,
  ],
})
export class IntegrationsPageComponent implements OnInit {
  private readonly uiSchema = inject(UiSchemaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly schema = signal<UiSchemaEnvelope | null>(null);
  readonly error = signal<string | null>(null);
  readonly toast = signal<{ kind: 'ok' | 'error'; message: string } | null>(
    null,
  );

  ngOnInit(): void {
    this.uiSchema.getView('settings.integrations').subscribe({
      next: (s) => this.schema.set(s),
      error: (e) => this.error.set(String(e?.message ?? e)),
    });

    const qp = this.route.snapshot.queryParamMap;
    const connected = qp.get('connected');
    const err = qp.get('error');
    if (connected) {
      this.toast.set({
        kind: 'ok',
        message: `${connected} integration connected successfully.`,
      });
    } else if (err) {
      this.toast.set({ kind: 'error', message: `OAuth failed: ${err}` });
    }
    if (connected || err) {
      void this.router.navigate([], {
        queryParams: {},
        replaceUrl: true,
      });
      setTimeout(() => this.toast.set(null), 5000);
    }
  }
}
