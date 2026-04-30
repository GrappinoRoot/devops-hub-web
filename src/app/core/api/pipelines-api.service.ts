import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  PipelineListQuery,
  PipelineListResponse,
  PipelineRunDto,
  PipelineStatsDto,
  RepositoryDto,
} from '@devops-hub/contracts';
import { ApiUrlService } from './api-url.service';

export interface SyncResult {
  integrations: number;
  repositories: number;
  runs: number;
}

/**
 * Thin wrapper over `/pipelines/*` endpoints. Components should depend on this
 * service rather than calling HttpClient directly: it makes URLs consistent
 * and keeps the HTTP surface easy to mock in tests.
 */
@Injectable({ providedIn: 'root' })
export class PipelinesApiService {
  private readonly http = inject(HttpClient);
  private readonly url = inject(ApiUrlService);

  listRepositories(): Observable<RepositoryDto[]> {
    return this.http.get<RepositoryDto[]>(this.url.build('/pipelines/repositories'));
  }

  listRuns(query: PipelineListQuery = {}): Observable<PipelineListResponse> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) {
        for (const item of v) params = params.append(k, String(item));
      } else {
        params = params.set(k, String(v));
      }
    }
    return this.http.get<PipelineListResponse>(
      this.url.build('/pipelines/runs'),
      { params },
    );
  }

  getRun(id: string): Observable<PipelineRunDto> {
    return this.http.get<PipelineRunDto>(
      this.url.build(`/pipelines/runs/${id}`),
    );
  }

  getStats(): Observable<PipelineStatsDto> {
    return this.http.get<PipelineStatsDto>(this.url.build('/pipelines/stats'));
  }

  syncAll(integrationId?: string): Observable<SyncResult> {
    return this.http.post<SyncResult>(
      this.url.build('/pipelines/sync'),
      integrationId ? { integrationId } : {},
    );
  }

  listBranches(repositoryId: string): Observable<string[]> {
    return this.http.get<string[]>(
      this.url.build(`/pipelines/repositories/${repositoryId}/branches`),
    );
  }

  rerunRun(id: string): Observable<{ runId: string; status: 'queued' }> {
    return this.http.post<{ runId: string; status: 'queued' }>(
      this.url.build(`/pipelines/runs/${id}/rerun`),
      {},
    );
  }
}
