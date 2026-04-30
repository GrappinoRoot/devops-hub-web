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
import { firstValueFrom } from 'rxjs';
import type {
  CreatePatIntegrationDto,
  IntegrationSummary,
  OauthStartDto,
  ProviderKind,
  UiNode,
} from '@devops-hub/contracts';
import { ApiUrlService } from '../../core/api/api-url.service';
import { ErrorMessageService } from '../../core/api/error-message.service';
import { IntegrationsApiService } from '../../core/api/integrations-api.service';
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

  private readonly api = inject(IntegrationsApiService);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly errors = inject(ErrorMessageService);
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
    try {
      const list = await firstValueFrom(this.api.list());
      this.integrations.set(list);
      this.error.set(null);
    } catch (err) {
      this.error.set(this.errors.format(err));
    }
  }

  async startOauth(kind: ProviderKind): Promise<void> {
    this.busy.set(kind);
    this.error.set(null);
    try {
      const body: OauthStartDto = {
        provider: kind,
        redirectUri: this.apiUrl.build(`/integrations/oauth/${kind}/callback`),
      };
      const res = await firstValueFrom(this.api.startOauth(body));
      window.location.assign(res.authorizeUrl);
    } catch (err) {
      this.error.set(this.errors.format(err));
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
      await firstValueFrom(this.api.createPat(body));
      this.patForm.set(null);
      await this.reload();
      this.bus.emit('integrations.changed', this.node.id, { kind });
    } catch (err) {
      this.error.set(this.errors.format(err));
    } finally {
      this.busy.set(null);
    }
  }

  async disconnect(integration: IntegrationSummary): Promise<void> {
    if (!confirm(`Disconnect ${integration.label}?`)) return;
    this.busy.set(integration.provider);
    try {
      await firstValueFrom(this.api.remove(integration.id));
      await this.reload();
      this.bus.emit('integrations.changed', this.node.id, {
        kind: integration.provider,
      });
    } catch (err) {
      this.error.set(this.errors.format(err));
    } finally {
      this.busy.set(null);
    }
  }
}
