import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import type {
  PipelineListResponse,
  PipelineRunDto,
  UiNode,
} from '@devops-hub/contracts';
import { ApiUrlService } from '../../core/api/api-url.service';
import { RealtimeService } from '../../core/realtime/realtime.service';
import { UiEventBusService } from '../../core/ui/ui-event-bus.service';

interface EmptyAction {
  label: string;
  variant?: 'primary' | 'secondary';
  event?: string;
  navigateTo?: string;
}

@Component({
  selector: 'ui-pipeline-list-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    @if (loading()) {
      <div class="status">Loading…</div>
    } @else if (runs().length === 0) {
      <div class="status empty">
        <p class="empty-message">{{ emptyMessage() }}</p>
        @if (emptyHint()) {
          <p class="empty-hint">{{ emptyHint() }}</p>
        }
        @if (emptyActions().length > 0) {
          <div class="empty-actions">
            @for (a of emptyActions(); track a.label) {
              <button
                type="button"
                class="ui-button"
                [class.primary]="a.variant === 'primary'"
                [class.secondary]="a.variant !== 'primary'"
                (click)="onEmptyAction(a)"
              >
                {{ a.label }}
              </button>
            }
          </div>
        }
      </div>
    } @else {
      <table class="pipeline-table">
        <thead>
          <tr>
            <th>Status</th><th>Repository</th><th>Name</th><th>Ref</th>
            <th>Actor</th><th>Started</th><th>Duration</th>
          </tr>
        </thead>
        <tbody>
          @for (run of runs(); track run.id) {
            <tr class="row" (click)="openRun(run.id)">
              <td><span class="badge" [class]="run.status">{{ run.status }}</span></td>
              <td>{{ run.repositoryFullName }}</td>
              <td>{{ run.name }}</td>
              <td>{{ run.ref }}</td>
              <td>{{ run.actor ?? '—' }}</td>
              <td>{{ run.startedAt | date: 'short' }}</td>
              <td>{{ run.durationSec ? run.durationSec + 's' : '—' }}</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: [
    `.pipeline-table { width: 100%; border-collapse: collapse; font-size: 14px; }`,
    `.pipeline-table th, .pipeline-table td { text-align: left; padding: 8px 10px;
       border-bottom: 1px solid #e2e8f0; }`,
    `.pipeline-table th { background: #f8fafc; font-weight: 600; color: #475569; }`,
    `.pipeline-table tr.row { cursor: pointer; }`,
    `.pipeline-table tr.row:hover td { background: #f8fafc; }`,
    `.badge { display: inline-block; padding: 2px 8px; border-radius: 999px;
             font-size: 12px; text-transform: uppercase; letter-spacing: 0.02em; }`,
    `.badge.success { background: #dcfce7; color: #166534; }`,
    `.badge.failure, .badge.timed_out { background: #fee2e2; color: #991b1b; }`,
    `.badge.in_progress, .badge.queued { background: #fef9c3; color: #854d0e; }`,
    `.badge.cancelled, .badge.skipped, .badge.unknown { background: #e2e8f0; color: #475569; }`,
    `.status { padding: 16px; color: #64748b; }`,
    `.status.empty { text-align: center; padding: 40px 20px; }`,
    `.empty-message { margin: 0 0 8px; font-size: 16px; color: #334155; }`,
    `.empty-hint { margin: 0 auto 20px; max-width: 480px; color: #64748b; font-size: 14px; }`,
    `.empty-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }`,
    `.ui-button { border: 1px solid #cbd5e1; background: #fff; padding: 8px 16px;
                   border-radius: 6px; cursor: pointer; font: inherit; }`,
    `.ui-button.primary { background: #1e293b; color: #fff; border-color: #1e293b; }`,
    `.ui-button.secondary { background: #f1f5f9; }`,
    `.ui-button:hover { filter: brightness(0.96); }`,
  ],
})
export class PipelineListNodeComponent implements OnInit, OnDestroy {
  @Input({ required: true }) node!: UiNode;

  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly realtime = inject(RealtimeService);
  private readonly bus = inject(UiEventBusService);
  private readonly router = inject(Router);

  readonly runs = signal<PipelineRunDto[]>([]);
  readonly loading = signal<boolean>(true);

  private filterRepositoryId: string | null = null;
  private readonly extraFilters: Record<string, string> = {};
  private readonly subs: Subscription[] = [];
  private rtSubscriptions: Array<{ unsubscribe: () => void }> = [];

  emptyMessage(): string {
    return (this.node.props?.['emptyMessage'] as string) ?? 'No data.';
  }

  emptyHint(): string | null {
    return (this.node.props?.['emptyHint'] as string) ?? null;
  }

  emptyActions(): EmptyAction[] {
    return (this.node.props?.['emptyActions'] as EmptyAction[]) ?? [];
  }

  onEmptyAction(a: EmptyAction): void {
    if (a.event) {
      this.bus.emit(a.event, this.node.id);
    } else if (a.navigateTo) {
      void this.router.navigateByUrl(a.navigateTo);
    }
  }

  openRun(id: string): void {
    void this.router.navigate(['/runs', id]);
  }

  ngOnInit(): void {
    this.reload();

    this.subs.push(
      this.bus.on<{ repositoryId?: string | null }>('repo-picker.change').subscribe((ev) => {
        const id = (ev.payload?.repositoryId ?? null) as string | null;
        this.filterRepositoryId = id && id.length > 0 ? id : null;
        this.reload();
      }),
      this.bus
        .on<{ name?: string; value?: string | null }>('select.change')
        .subscribe((ev) => {
          const name = ev.payload?.name;
          if (!name) return;
          const value = ev.payload?.value ?? null;
          if (value && value.length > 0) {
            this.extraFilters[name] = value;
          } else {
            delete this.extraFilters[name];
          }
          this.reload();
        }),
      this.bus.on('binding.reload').subscribe(() => this.reload()),
    );

    if (this.node.binding?.live) {
      this.rtSubscriptions.push(
        this.realtime.on<PipelineRunDto>('pipelines', 'pipeline.created'),
        this.realtime.on<PipelineRunDto>('pipelines', 'pipeline.updated'),
      );
      for (const sub of this.rtSubscriptions) {
        this.subs.push(
          (sub as any).stream.subscribe((ev: { data: PipelineRunDto }) =>
            this.mergeRun(ev.data),
          ),
        );
      }
    }
  }

  ngOnDestroy(): void {
    for (const s of this.subs) s.unsubscribe();
    for (const r of this.rtSubscriptions) r.unsubscribe();
  }

  private reload(): void {
    const source = this.node.binding?.source;
    if (!source) return;
    this.loading.set(true);
    const url = this.apiUrl.build(source);
    let params = new HttpParams();
    const bound = (this.node.binding?.params ?? {}) as Record<string, unknown>;
    for (const [k, v] of Object.entries(bound)) {
      if (v !== undefined && v !== null) params = params.set(k, String(v));
    }
    if (this.filterRepositoryId) params = params.set('repositoryId', this.filterRepositoryId);
    for (const [k, v] of Object.entries(this.extraFilters)) {
      params = params.set(k, v);
    }
    this.http.get<PipelineListResponse>(url, { params }).subscribe({
      next: (res) => {
        this.runs.set(res.items);
        this.loading.set(false);
      },
      error: () => {
        this.runs.set([]);
        this.loading.set(false);
      },
    });
  }

  private mergeRun(run: PipelineRunDto): void {
    if (this.filterRepositoryId && run.repositoryId !== this.filterRepositoryId) return;
    const current = this.runs();
    const idx = current.findIndex((r) => r.id === run.id);
    if (idx === -1) this.runs.set([run, ...current]);
    else {
      const next = current.slice();
      next[idx] = run;
      this.runs.set(next);
    }
  }
}
