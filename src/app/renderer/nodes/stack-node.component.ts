import { ChangeDetectionStrategy, Component, Input, forwardRef } from '@angular/core';
import type { UiNode } from '@devops-hub/contracts';
import { UiNodeRendererComponent } from '../ui-node-renderer.component';

@Component({
  selector: 'ui-stack-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [forwardRef(() => UiNodeRendererComponent)],
  template: `
    <div class="ui-stack" [style.flex-direction]="direction()"
         [style.gap.px]="gap()"
         [style.align-items]="align()"
         [style.justify-content]="justify()">
      @for (child of node.children ?? []; track child.id) {
        <ui-node [node]="child" />
      }
    </div>
  `,
  styles: [`.ui-stack { display: flex; }`],
})
export class StackNodeComponent {
  @Input({ required: true }) node!: UiNode;

  direction(): string {
    return (this.node.props?.['direction'] as string) ?? 'column';
  }
  gap(): number {
    return (this.node.props?.['gap'] as number) ?? 8;
  }
  align(): string {
    return (this.node.props?.['align'] as string) ?? 'stretch';
  }
  justify(): string {
    return (this.node.props?.['justify'] as string) ?? 'flex-start';
  }
}
