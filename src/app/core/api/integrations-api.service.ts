import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  CreatePatIntegrationDto,
  IntegrationSummary,
  OauthStartDto,
  OauthStartResponse,
} from '@devops-hub/contracts';
import { ApiUrlService } from './api-url.service';

/**
 * Thin wrapper over `/integrations/*` endpoints.
 */
@Injectable({ providedIn: 'root' })
export class IntegrationsApiService {
  private readonly http = inject(HttpClient);
  private readonly url = inject(ApiUrlService);

  list(): Observable<IntegrationSummary[]> {
    return this.http.get<IntegrationSummary[]>(this.url.build('/integrations'));
  }

  createPat(dto: CreatePatIntegrationDto): Observable<IntegrationSummary> {
    return this.http.post<IntegrationSummary>(
      this.url.build('/integrations/pat'),
      dto,
    );
  }

  startOauth(dto: OauthStartDto): Observable<OauthStartResponse> {
    return this.http.post<OauthStartResponse>(
      this.url.build('/integrations/oauth/start'),
      dto,
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(this.url.build(`/integrations/${id}`));
  }
}
