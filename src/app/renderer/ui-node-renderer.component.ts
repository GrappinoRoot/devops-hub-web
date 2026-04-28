import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Subscription } from 'rxjs';
import type { UiNode } from '@devops-hub/contracts';
import { UiActionRunnerService } from '../core/ui/ui-action-runner.service';
import { UiEventBusService } from '../core/ui/ui-event-bus.service';
import { PageNodeComponent } from './nodes/page-node.component';
import { PanelNodeComponent } from './nodes/panel-node.component';
import { StackNodeComponent } from './nodes/stack-node.component';
import { TextNodeComponent } from './nodes/text-node.component';
import { ButtonNodeComponent } from './nodes/button-node.component';
import { RepoPickerNodeComponent } from './nodes/repo-picker-node.component';
import { PipelineListNodeComponent } from './nodes/pipeline-list-node.component';
import { EmptyStateNodeComponent } from './nodes/empty-state-node.component';
import { ProviderGridNodeComponent } from './nodes/provider-grid-node.component';
import { SelectNodeComponent } from './nodes/select-node.component';

@Component({
  selector: 'ui-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageNodeComponent,
    PanelNodeComponent,
    StackNodeComponent,
    TextNodeComponent,
    ButtonNodeComponent,
    RepoPickerNodeComponent,
    PipelineListNodeComponent,
    EmptyStateNodeComponent,
    ProviderGridNodeComponent,
    SelectNodeComponent,
  ],
  template: `
    @switch (node.type) {
      @case ('page') { <ui-page-node [node]="node" /> }
      @case ('panel') { <ui-panel-node [node]="node" /> }
      @case ('stack') { <ui-stack-node [node]="node" /> }
      @case ('text') { <ui-text-node [node]="node" /> }
      @case ('button') { <ui-button-node [node]="node" /> }
      @case ('repo-picker') { <ui-repo-picker-node [node]="node" /> }
      @case ('pipeline-list') { <ui-pipeline-list-node [node]="node" /> }
      @case ('empty-state') { <ui-empty-state-node [node]="node" /> }
      @case ('provider-grid') { <ui-provider-grid-node [node]="node" /> }
      @case ('select') { <ui-select-node [node]="node" /> }
      @default {
        <div class="ui-node-unknown">
          unknown node type: {{ node.type }} ({{ node.id }})
        </div>
      }
    }
  `,
})
export class UiNodeRendererComponent implements OnInit, OnDestroy {
  @Input({ required: true }) node!: UiNode;

  private readonly bus = inject(UiEventBusService);
  private readonly runner = inject(UiActionRunnerService);
  private readonly subs: Subscription[] = [];

  ngOnInit(): void {
    const handlers = this.node.on;
    if (!handlers) return;
    for (const [event, actions] of Object.entries(handlers)) {
      this.subs.push(
        this.bus.on(event).subscribe((ev) => {
          void this.runner.run(this.bus, this.node.id, actions, {
            triggeredBy: ev.sourceId,
            eventPayload: ev.payload,
          });
        }),
      );
    }
  }

  ngOnDestroy(): void {
    for (const s of this.subs) s.unsubscribe();
  }
}
