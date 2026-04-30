import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import type { UiSchemaEnvelope } from '@devops-hub/contracts';
import { ErrorMessageService } from '../../core/api/error-message.service';
import { UiSchemaService } from '../../core/ui/ui-schema.service';
import { UiEventBusService } from '../../core/ui/ui-event-bus.service';
import { UiNodeRendererComponent } from '../../renderer/ui-node-renderer.component';

@Component({
  selector: 'app-home-page',
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
export class HomePageComponent implements OnInit {
  private readonly uiSchema = inject(UiSchemaService);
  private readonly errors = inject(ErrorMessageService);

  readonly schema = signal<UiSchemaEnvelope | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.uiSchema.getView('dashboard.home').subscribe({
      next: (s) => this.schema.set(s),
      error: (e) => this.error.set(this.errors.format(e)),
    });
  }
}
