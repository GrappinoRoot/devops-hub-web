import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import type { RepositoryDto, UiNode } from '@devops-hub/contracts';
import { PipelinesApiService } from '../../core/api/pipelines-api.service';
import { UiEventBusService } from '../../core/ui/ui-event-bus.service';

@Component({
  selector: 'ui-repo-picker-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <select class="ui-repo-picker" (change)="onChange($any($event.target).value)">
      <option value="">{{ placeholder() }}</option>
      @for (repo of repos(); track repo.id) {
        <option [value]="repo.id">{{ repo.fullName }}</option>
      }
    </select>
  `,
  styles: [
    `.ui-repo-picker { padding: 6px 10px; border: 1px solid #cbd5e1;
                       border-radius: 6px; background: #fff; font: inherit; min-width: 220px; }`,
  ],
})
export class RepoPickerNodeComponent implements OnInit {
  @Input({ required: true }) node!: UiNode;

  private readonly api = inject(PipelinesApiService);
  private readonly bus = inject(UiEventBusService);
  readonly repos = signal<RepositoryDto[]>([]);

  placeholder(): string {
    return (this.node.props?.['placeholder'] as string) ?? 'All repositories';
  }

  ngOnInit(): void {
    this.api.listRepositories().subscribe({
      next: (list) => this.repos.set(list),
      error: () => this.repos.set([]),
    });
  }

  onChange(repositoryId: string): void {
    this.bus.emit('repo-picker.change', this.node.id, { repositoryId: repositoryId || null });
  }
}
