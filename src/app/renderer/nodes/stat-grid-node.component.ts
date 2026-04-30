import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import type { UiNode } from '@devops-hub/contracts';
import { ApiUrlService } from '../../core/api/api-url.service';
import { ErrorMessageService } from '../../core/api/error-message.service';
import { UiEventBusService } from '../../core/ui/ui-event-bus.service';

interface StatCardSpec {
  id: string;
  label: string;
  path: string;
  hint?: string;
  suffix?: string;
  prefix?: string;
  color?: 'slate' | 'green' | 'red' | 'amber' | 'blue';
  icon?: string;
}

interface TopRepoEntry {
  repositoryId: string;
  repositoryFullName: string;
  totalRuns: number;
  successCount: number;
  failureCount: number;
  successRate: number;
}

@Component({
  selector: 'ui-stat-grid-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="status">Loading…</div>
    } @else if (error(); as e) {
      <div class="status error">{{ e }}</div>
    } @else if (!data()) {
      <div class="status">{{ emptyMessage() }}</div>
    } @else {
      <div class="grid">
        @for (card of cards(); track card.id) {
          <div class="card" [attr.data-color]="card.color ?? 'slate'">
            <div class="label">{{ format(card.label) }}</div>
            <div class="value">
              {{ card.prefix ?? '' }}{{ valueOf(card.path) }}{{ card.suffix ?? '' }}
            </div>
            @if (card.hint) {
              <div class="hint">{{ format(card.hint) }}</div>
            }
          </div>
        }
      </div>
      @if (topRepos().length > 0) {
        <div class="top">
          <h3>{{ format(topTitle()) }}</h3>
          <table>
            <thead>
              <tr><th>Repository</th><th>Runs</th><th>Success</th><th>Failure</th><th>Rate</th></tr>
            </thead>
            <tbody>
              @for (r of topRepos(); track r.repositoryId) {
                <tr>
                  <td>{{ r.repositoryFullName }}</td>
                  <td>{{ r.totalRuns }}</td>
                  <td class="ok">{{ r.successCount }}</td>
                  <td class="ko">{{ r.failureCount }}</td>
                  <td>{{ r.successRate }}%</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    }
  `,
  styles: [
    `:host { display: block; }`,
    `.status { padding: 16px; color: #64748b; }`,
    `.status.error { color: #b91c1c; }`,
    `.grid { display: grid; gap: 16px;
       grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }`,
    `.card { padding: 16px; border-radius: 10px; background: #fff;
       border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(15,23,42,.04); }`,
    `.card[data-color="green"] { border-left: 3px solid #16a34a; }`,
    `.card[data-color="red"] { border-left: 3px solid #dc2626; }`,
    `.card[data-color="amber"] { border-left: 3px solid #d97706; }`,
    `.card[data-color="blue"] { border-left: 3px solid #2563eb; }`,
    `.card[data-color="slate"] { border-left: 3px solid #94a3b8; }`,
    `.label { font-size: 12px; text-transform: uppercase; letter-spacing: .04em;
       color: #64748b; margin-bottom: 6px; }`,
    `.value { font-size: 28px; font-weight: 600; color: #0f172a; }`,
    `.hint { margin-top: 6px; font-size: 12px; color: #64748b; }`,
    `.top { margin-top: 24px; }`,
    `.top h3 { margin: 0 0 8px; font-size: 14px; color: #475569; }`,
    `.top table { width: 100%; border-collapse: collapse; font-size: 14px; }`,
    `.top th, .top td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }`,
    `.top th { background: #f8fafc; font-weight: 600; color: #475569; }`,
    `.top td.ok { color: #166534; }`,
    `.top td.ko { color: #991b1b; }`,
  ],
})
export class StatGridNodeComponent implements OnInit, OnDestroy {
  @Input({ required: true }) node!: UiNode;

  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly errors = inject(ErrorMessageService);
  private readonly bus = inject(UiEventBusService);

  readonly data = signal<Record<string, unknown> | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  private readonly subs: Subscription[] = [];

  cards(): StatCardSpec[] {
    return (this.node.props?.['cards'] as StatCardSpec[]) ?? [];
  }
  emptyMessage(): string {
    return (this.node.props?.['emptyMessage'] as string) ?? 'No data.';
  }
  topTitle(): string {
    return (this.node.props?.['topRepositoriesTitle'] as string) ?? 'Top repositories';
  }
  topRepos(): TopRepoEntry[] {
    const path = (this.node.props?.['topRepositoriesPath'] as string) ?? 'topRepositories';
    const v = this.lookup(path);
    return Array.isArray(v) ? (v as TopRepoEntry[]) : [];
  }

  valueOf(path: string): string {
    const v = this.lookup(path);
    if (v === undefined || v === null) return '—';
    return typeof v === 'number' ? String(v) : String(v);
  }

  /** Replaces `{key}` placeholders in label/hint strings with values from the response. */
  format(text: string): string {
    return text.replace(/\{([a-zA-Z0-9_.]+)\}/g, (_, k) => {
      const v = this.lookup(k);
      return v === undefined || v === null ? '' : String(v);
    });
  }

  private lookup(path: string): unknown {
    const obj = this.data();
    if (!obj || !path) return undefined;
    return path.split('.').reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object' && key in (acc as object)) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  ngOnInit(): void {
    this.reload();
    this.subs.push(this.bus.on('binding.reload').subscribe(() => this.reload()));
  }

  ngOnDestroy(): void {
    for (const s of this.subs) s.unsubscribe();
  }

  private reload(): void {
    const source = this.node.binding?.source;
    if (!source) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.http.get<Record<string, unknown>>(this.apiUrl.build(source)).subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.data.set(null);
        this.error.set(this.errors.format(err));
        this.loading.set(false);
      },
    });
  }
}
