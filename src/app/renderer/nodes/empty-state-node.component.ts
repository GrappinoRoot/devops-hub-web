import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { UiNode } from '@devops-hub/contracts';

@Component({
  selector: 'ui-empty-state-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-empty">
      <p>{{ message() }}</p>
    </div>
  `,
  styles: [
    `.ui-empty { padding: 24px; text-align: center; color: #64748b; }`,
  ],
})
export class EmptyStateNodeComponent {
  @Input({ required: true }) node!: UiNode;

  message(): string {
    return (this.node.props?.['message'] as string) ?? 'No data.';
  }
}
