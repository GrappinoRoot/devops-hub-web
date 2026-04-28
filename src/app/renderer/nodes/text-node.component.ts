import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { UiNode } from '@devops-hub/contracts';

@Component({
  selector: 'ui-text-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (variant()) {
      @case ('h1') { <h1 class="ui-text">{{ text() }}</h1> }
      @case ('h2') { <h2 class="ui-text">{{ text() }}</h2> }
      @case ('h3') { <h3 class="ui-text">{{ text() }}</h3> }
      @case ('muted') { <span class="ui-text muted">{{ text() }}</span> }
      @default { <span class="ui-text">{{ text() }}</span> }
    }
  `,
  styles: [
    `.ui-text { margin: 0; font-family: inherit; }`,
    `.ui-text.muted { color: #64748b; font-size: 0.9em; }`,
  ],
})
export class TextNodeComponent {
  @Input({ required: true }) node!: UiNode;

  variant(): string {
    return (this.node.props?.['variant'] as string) ?? 'body';
  }
  text(): string {
    return (this.node.props?.['text'] as string) ?? '';
  }
}
