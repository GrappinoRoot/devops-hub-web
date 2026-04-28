import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type {
  CreatePatIntegrationDto,
  IntegrationSummary,
  OauthStartDto,
  OauthStartResponse,
  ProviderKind,
  UiNode,
} from '@devops-hub/contracts';
import { environment } from '../../../environments/environment';
import { UiEventBusService } from '../../core/ui/ui-event-bus.service';

interface ProviderCardSpec {
  kind: ProviderKind;
  name: string;
  description: string;
  oauth: boolean;
  pat: boolean;
  status: 'available' | 'coming-soon';
}

@Component({
  selector: 'ui-provider-grid-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './provider-grid-node.component.html',
  styleUrl: './provider-grid-node.component.scss',
})
export class ProviderGridNodeComponent implements OnInit {
  @Input({ required: true }) node!: UiNode;

  private readonly http = inject(HttpClient);
  private readonly bus = inject(UiEventBusService);

  readonly integrations = signal<IntegrationSummary[]>([]);
  readonly busy = signal<ProviderKind | null>(null);
  readonly error = signal<string | null>(null);
  readonly patForm = signal<ProviderKind | null>(null);
  readonly patLabel = signal('');
  readonly patToken = signal('');
  readonly patBaseUrl = signal('');

  readonly providers = computed<ProviderCardSpec[]>(
    () => (this.node.props?.['providers'] as ProviderCardSpec[]) ?? [],
  );

  ngOnInit(): void {
    void this.reload();
  }

  connectionsFor(kind: ProviderKind): IntegrationSummary[] {
    return this.integrations().filter((i) => i.provider === kind);
  }

  async reload(): Promise<void> {
    const source = this.node.binding?.source ?? '/api/integrations';
    const url = this.absolute(source);
    try {
      const list = await firstValueFrom(this.http.get<IntegrationSummary[]>(url));
      this.integrations.set(list);
      this.error.set(null);
    } catch (err) {
      this.error.set(this.toMessage(err));
    }
  }

  async startOauth(kind: ProviderKind): Promise<void> {
    this.busy.set(kind);
    this.error.set(null);
    try {
      const body: OauthStartDto = {
        provider: kind,
        redirectUri: `${environment.apiBaseUrl}/integrations/oauth/${kind}/callback`,
      };
      const res = await firstValueFrom(
        this.http.post<OauthStartResponse>(
          `${environment.apiBaseUrl}/integrations/oauth/start`,
          body,
        ),
      );
      window.location.assign(res.authorizeUrl);
    } catch (err) {
      this.error.set(this.toMessage(err));
      this.busy.set(null);
    }
  }

  togglePatForm(kind: ProviderKind): void {
    this.patForm.set(this.patForm() === kind ? null : kind);
    this.patLabel.set('');
    this.patToken.set('');
    this.patBaseUrl.set('');
  }

  async submitPat(kind: ProviderKind): Promise<void> {
    if (!this.patToken().trim()) return;
    this.busy.set(kind);
    this.error.set(null);
    try {
      const body: CreatePatIntegrationDto = {
        provider: kind,
        label: this.patLabel().trim() || `${kind} (PAT)`,
        token: this.patToken().trim(),
        ...(this.patBaseUrl().trim() ? { baseUrl: this.patBaseUrl().trim() } : {}),
      };
      await firstValueFrom(
        this.http.post<IntegrationSummary>(
          `${environment.apiBaseUrl}/integrations/pat`,
          body,
        ),
      );
      this.patForm.set(null);
      await this.reload();
      this.bus.emit('integrations.changed', this.node.id, { kind });
    } catch (err) {
      this.error.set(this.toMessage(err));
    } finally {
      this.busy.set(null);
    }
  }

  async disconnect(integration: IntegrationSummary): Promise<void> {
    if (!confirm(`Disconnect ${integration.label}?`)) return;
    this.busy.set(integration.provider);
    try {
      await firstValueFrom(
        this.http.delete<void>(
          `${environment.apiBaseUrl}/integrations/${integration.id}`,
        ),
      );
      await this.reload();
      this.bus.emit('integrations.changed', this.node.id, {
        kind: integration.provider,
      });
    } catch (err) {
      this.error.set(this.toMessage(err));
    } finally {
      this.busy.set(null);
    }
  }

  private absolute(source: string): string {
    return source.startsWith('http')
      ? source
      : `${environment.apiBaseUrl}${source.replace(/^\/api/, '')}`;
  }

  private toMessage(err: unknown): string {
    const e = err as { error?: { message?: string }; message?: string };
    return e?.error?.message ?? e?.message ?? 'unknown error';
  }
}
