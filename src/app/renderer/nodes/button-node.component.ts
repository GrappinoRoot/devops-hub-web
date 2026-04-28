import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import type { UiNode } from '@devops-hub/contracts';
import { UiActionRunnerService } from '../../core/ui/ui-action-runner.service';
import { UiEventBusService } from '../../core/ui/ui-event-bus.service';

@Component({
  selector: 'ui-button-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="ui-button" [class]="variantClass()" (click)="onClick()">
      {{ label() }}
    </button>
  `,
  styles: [
    `.ui-button { border: 1px solid #cbd5e1; background: #fff; padding: 6px 12px;
                   border-radius: 6px; cursor: pointer; font: inherit; }`,
    `.ui-button.primary { background: #2563eb; color: #fff; border-color: #2563eb; }`,
    `.ui-button.secondary { background: #f1f5f9; }`,
    `.ui-button:hover { filter: brightness(0.96); }`,
  ],
})
export class ButtonNodeComponent {
  @Input({ required: true }) node!: UiNode;
  private readonly bus = inject(UiEventBusService);
  private readonly runner = inject(UiActionRunnerService);

  label(): string {
    return (this.node.props?.['label'] as string) ?? 'Button';
  }
  variantClass(): string {
    return (this.node.props?.['variant'] as string) ?? 'secondary';
  }

  onClick(): void {
    const handlers = this.node.on?.['button.click'];
    if (handlers) {
      void this.runner.run(this.bus, this.node.id, handlers);
    } else {
      this.bus.emit('button.click', this.node.id);
    }
  }
}
