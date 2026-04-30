import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { PipelineRunDto } from '@devops-hub/contracts';
import { PipelinesApiService } from '../../core/api/pipelines-api.service';
import { ErrorMessageService } from '../../core/api/error-message.service';
import { ToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-run-details-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  template: `
    <section class="page">
      <a routerLink="/pipelines" class="back">← Back to pipelines</a>

      @if (loading()) {
        <p class="status">Loading run…</p>
      } @else if (error()) {
        <p class="status error">{{ error() }}</p>
      } @else if (run(); as r) {
        <header class="head">
          <div class="title">
            <span class="badge" [class]="r.status">{{ r.status }}</span>
            <h1>{{ r.name }}</h1>
          </div>
          <div class="actions">
            @if (canRerun(r)) {
              <button
                type="button"
                class="ui-button"
                [disabled]="rerunning()"
                (click)="rerun(r.id)"
              >
                {{ rerunning() ? 'Re-running…' : 'Re-run' }}
              </button>
            }
            <a class="open-ext" [href]="r.htmlUrl" target="_blank" rel="noopener">
              Open on provider ↗
            </a>
          </div>
        </header>

        <dl class="grid">
          <dt>Repository</dt>
          <dd>{{ r.repositoryFullName }}</dd>

          <dt>Provider</dt>
          <dd>{{ r.provider }}</dd>

          <dt>Branch / Ref</dt>
          <dd>{{ r.ref }}</dd>

          <dt>Commit</dt>
          <dd class="mono">{{ r.commitSha.substring(0, 12) }}</dd>

          @if (r.commitMessage) {
            <dt>Commit message</dt>
            <dd>{{ r.commitMessage }}</dd>
          }

          <dt>Actor</dt>
          <dd>{{ r.actor ?? '—' }}</dd>

          <dt>Status</dt>
          <dd>{{ r.status }}@if (r.conclusion) { · {{ r.conclusion }} }</dd>

          <dt>Started</dt>
          <dd>{{ r.startedAt ? (r.startedAt | date: 'medium') : '—' }}</dd>

          <dt>Finished</dt>
          <dd>{{ r.finishedAt ? (r.finishedAt | date: 'medium') : '—' }}</dd>

          <dt>Duration</dt>
          <dd>{{ r.durationSec != null ? r.durationSec + 's' : '—' }}</dd>

          <dt>External id</dt>
          <dd class="mono">{{ r.externalId }}</dd>
        </dl>
      }
    </section>
  `,
  styles: [
    `:host { display: block; }`,
    `.page { padding: 24px; max-width: 880px; margin: 0 auto; }`,
    `.back { display: inline-block; margin-bottom: 16px; color: #475569;
             text-decoration: none; font-size: 14px; }`,
    `.back:hover { color: #0f172a; }`,
    `.head { display: flex; align-items: center; justify-content: space-between;
              gap: 16px; margin-bottom: 24px; }`,
    `.title { display: flex; align-items: center; gap: 12px; }`,
    `h1 { margin: 0; font-size: 22px; color: #0f172a; }`,
    `.open-ext { color: #1d4ed8; text-decoration: none; font-size: 14px; }`,
    `.open-ext:hover { text-decoration: underline; }`,
    `.actions { display: flex; align-items: center; gap: 12px; }`,
    `.ui-button { border: 1px solid #1e293b; background: #1e293b; color: #fff;
                  padding: 6px 14px; border-radius: 6px; cursor: pointer; font: inherit; }`,
    `.ui-button:disabled { opacity: 0.6; cursor: not-allowed; }`,
    `.ui-button:hover:not(:disabled) { filter: brightness(1.1); }`,
    `.grid { display: grid; grid-template-columns: max-content 1fr; gap: 8px 24px;
            border-top: 1px solid #e2e8f0; padding-top: 16px; }`,
    `dt { color: #64748b; font-size: 13px; padding-top: 4px; }`,
    `dd { margin: 0; color: #0f172a; font-size: 14px; }`,
    `.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }`,
    `.badge { display: inline-block; padding: 2px 10px; border-radius: 999px;
             font-size: 12px; text-transform: uppercase; letter-spacing: 0.02em; }`,
    `.badge.success { background: #dcfce7; color: #166534; }`,
    `.badge.failure, .badge.timed_out { background: #fee2e2; color: #991b1b; }`,
    `.badge.in_progress, .badge.queued { background: #fef9c3; color: #854d0e; }`,
    `.badge.cancelled, .badge.skipped, .badge.unknown { background: #e2e8f0; color: #475569; }`,
    `.status { padding: 16px 0; color: #64748b; }`,
    `.status.error { color: #b91c1c; }`,
  ],
})
export class RunDetailsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(PipelinesApiService);
  private readonly errors = inject(ErrorMessageService);
  private readonly toast = inject(ToastService);

  readonly run = signal<PipelineRunDto | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly rerunning = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Missing run id');
      this.loading.set(false);
      return;
    }
    this.fetchRun(id);
  }

  canRerun(r: PipelineRunDto): boolean {
    if (r.provider !== 'github') return false;
    return r.status !== 'in_progress' && r.status !== 'queued';
  }

  rerun(id: string): void {
    this.rerunning.set(true);
    this.api.rerunRun(id).subscribe({
      next: () => {
        this.toast.show('success', 'Re-run triggered. New run will appear after the next sync.');
        this.rerunning.set(false);
        this.fetchRun(id);
      },
      error: (e) => {
        this.toast.show('error', this.errors.format(e, 'Re-run failed'));
        this.rerunning.set(false);
      },
    });
  }

  private fetchRun(id: string): void {
    this.api.getRun(id).subscribe({
      next: (r) => {
        this.run.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(
          e?.status === 404 ? 'Run not found' : this.errors.format(e),
        );
        this.loading.set(false);
      },
    });
  }
}
