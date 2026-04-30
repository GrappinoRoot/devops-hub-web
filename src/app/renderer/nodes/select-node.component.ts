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
import { UiEventBusService } from '../../core/ui/ui-event-bus.service';

interface SelectOption {
  value: string;
  label: string;
}

/**
 * Generic dropdown node. Emits `select.change` with `{ name, value }` so
 * downstream listeners can filter or react to the selected option.
 */
@Component({
  selector: 'ui-select-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="wrap">
      @if (label()) {
        <span class="lbl">{{ label() }}</span>
      }
      <select class="sel" [disabled]="loading()" (change)="onChange($any($event.target).value)">
        <option value="">{{ loading() ? 'Loading…' : placeholder() }}</option>
        @for (o of options(); track o.value) {
          <option [value]="o.value">{{ o.label }}</option>
        }
      </select>
    </label>
  `,
  styles: [
    `.wrap { display: inline-flex; align-items: center; gap: 6px; }`,
    `.lbl { font-size: 13px; color: #475569; }`,
    `.sel { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px;
            background: #fff; font: inherit; min-width: 140px; }`,
    `.sel:disabled { opacity: 0.6; }`,
  ],
})
export class SelectNodeComponent implements OnInit, OnDestroy {
  @Input({ required: true }) node!: UiNode;

  private readonly bus = inject(UiEventBusService);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  readonly dynamicOptions = signal<SelectOption[] | null>(null);
  readonly loading = signal<boolean>(false);
  private readonly subs: Subscription[] = [];

  label(): string | null {
    return (this.node.props?.['label'] as string) ?? null;
  }
  placeholder(): string {
    return (this.node.props?.['placeholder'] as string) ?? 'Any';
  }
  options(): SelectOption[] {
    return (
      this.dynamicOptions() ?? (this.node.props?.['options'] as SelectOption[]) ?? []
    );
  }
  private name(): string {
    return (this.node.props?.['name'] as string) ?? this.node.id;
  }

  ngOnInit(): void {
    const dependsOn = this.node.props?.['dependsOn'] as string | undefined;
    if (!dependsOn) return;
    this.subs.push(
      this.bus.on<Record<string, unknown>>(dependsOn).subscribe((ev) => {
        const key = (this.node.props?.['dependencyKey'] as string) ?? 'value';
        const value = (ev.payload?.[key] ?? null) as string | null;
        this.loadDynamicOptions(value);
      }),
    );
  }

  ngOnDestroy(): void {
    for (const s of this.subs) s.unsubscribe();
  }

  onChange(value: string): void {
    this.bus.emit('select.change', this.node.id, {
      name: this.name(),
      value: value || null,
    });
  }

  /**
   * Fetches options from `sourceTemplate` after substituting `{value}` with the
   * dependency value. When no dependency value is available, falls back to the
   * static `options` declared on the node (via `dynamicOptions = null`).
   */
  private loadDynamicOptions(depValue: string | null): void {
    const template = this.node.props?.['sourceTemplate'] as string | undefined;
    if (!template || !depValue) {
      this.dynamicOptions.set(null);
      this.loading.set(false);
      return;
    }
    const url = this.apiUrl.build(template.replace('{value}', encodeURIComponent(depValue)));
    this.loading.set(true);
    this.http.get<string[] | SelectOption[]>(url).subscribe({
      next: (res) => {
        const opts: SelectOption[] = Array.isArray(res)
          ? res.map((r) =>
              typeof r === 'string' ? { value: r, label: r } : (r as SelectOption),
            )
          : [];
        this.dynamicOptions.set(opts);
        this.loading.set(false);
      },
      error: () => {
        this.dynamicOptions.set([]);
        this.loading.set(false);
      },
    });
  }
}
