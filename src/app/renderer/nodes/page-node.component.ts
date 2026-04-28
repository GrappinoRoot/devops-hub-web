import { ChangeDetectionStrategy, Component, Input, forwardRef } from '@angular/core';
import type { UiNode } from '@devops-hub/contracts';
import { UiNodeRendererComponent } from '../ui-node-renderer.component';

@Component({
  selector: 'ui-page-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [forwardRef(() => UiNodeRendererComponent)],
  template: `
    <section class="ui-page">
      @for (child of node.children ?? []; track child.id) {
        <ui-node [node]="child" />
      }
    </section>
  `,
  styles: [
    `.ui-page { display: flex; flex-direction: column; gap: 16px; padding: 20px; }`,
  ],
})
export class PageNodeComponent {
  @Input({ required: true }) node!: UiNode;
}
