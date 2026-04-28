import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import type { UiSchemaEnvelope } from '@devops-hub/contracts';
import { UiSchemaService } from '../../core/ui/ui-schema.service';
import { UiEventBusService } from '../../core/ui/ui-event-bus.service';
import { UiNodeRendererComponent } from '../../renderer/ui-node-renderer.component';

@Component({
  selector: 'app-pipelines-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiNodeRendererComponent],
  providers: [UiEventBusService],
  template: `
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
  ],
})
export class PipelinesPageComponent implements OnInit {
  private readonly uiSchema = inject(UiSchemaService);

  readonly schema = signal<UiSchemaEnvelope | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.uiSchema.getView('dashboard.pipelines').subscribe({
      next: (s) => this.schema.set(s),
      error: (e) => this.error.set(String(e?.message ?? e)),
    });
  }
}
