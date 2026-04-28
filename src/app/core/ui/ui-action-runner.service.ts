import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { UiAction } from '@devops-hub/contracts';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';
import { UiEventBusService } from './ui-event-bus.service';

/**
 * Executes a list of UiActions emitted by a node.
 * Supports `emit`, `http`, `navigate`, `toast` kinds as declared in contracts.
 */
@Injectable({ providedIn: 'root' })
export class UiActionRunnerService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  async run(
    bus: UiEventBusService,
    sourceId: string,
    actions: UiAction[],
    context: Record<string, unknown> = {},
  ): Promise<void> {
    for (const action of actions) {
      await this.execute(bus, sourceId, action, context);
    }
  }

  private async execute(
    bus: UiEventBusService,
    sourceId: string,
    action: UiAction,
    context: Record<string, unknown>,
  ): Promise<void> {
    switch (action.kind) {
      case 'emit':
        bus.emit(action.event, sourceId, { ...action.payload, ...context });
        return;
      case 'navigate':
        await this.router.navigateByUrl(action.to);
        return;
      case 'http': {
        const url = action.url.startsWith('http')
          ? action.url
          : `${environment.apiBaseUrl}${action.url}`;
        try {
          const result = await firstValueFrom(
            this.http.request(action.method, url, { body: action.body }),
          );
          if (action.onSuccess) bus.emit(action.onSuccess, sourceId, result);
        } catch (err) {
          if (action.onError) bus.emit(action.onError, sourceId, { error: String(err) });
        }
        return;
      }
      case 'toast':
        this.toast.show(action.level ?? 'info', action.message);
        return;
    }
  }
}
