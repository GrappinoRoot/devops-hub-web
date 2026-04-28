import { ChangeDetectionStrategy, Component, Input, forwardRef } from '@angular/core';
import type { UiNode } from '@devops-hub/contracts';
import { UiNodeRendererComponent } from '../ui-node-renderer.component';

@Component({
  selector: 'ui-panel-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [forwardRef(() => UiNodeRendererComponent)],
  template: `
    <div class="ui-panel" [class.padded]="padded()">
      @for (child of node.children ?? []; track child.id) {
        <ui-node [node]="child" />
      }
    </div>
  `,
  styles: [
    `.ui-panel { display: block; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; }`,
    `.ui-panel.padded { padding: 16px; }`,
  ],
})
export class PanelNodeComponent {
  @Input({ required: true }) node!: UiNode;

  padded(): boolean {
    return this.node.props?.['padded'] === true;
  }
}
