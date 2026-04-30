import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { PipelinesApiService } from './pipelines-api.service';
import { environment } from '../../../environments/environment';

describe('PipelinesApiService', () => {
  let svc: PipelinesApiService;
  let http: HttpTestingController;
  const base = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    svc = TestBed.inject(PipelinesApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GETs /pipelines/repositories', () => {
    svc.listRepositories().subscribe();
    const req = http.expectOne(`${base}/pipelines/repositories`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('GETs /pipelines/runs without query params when none provided', () => {
    svc.listRuns().subscribe();
    const req = http.expectOne((r) => r.url === `${base}/pipelines/runs`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ runs: [], total: 0 });
  });

  it('GETs /pipelines/runs with serialized query params', () => {
    svc
      .listRuns({ status: 'success', branch: 'main', limit: 25, repositoryId: 'r1' })
      .subscribe();
    const req = http.expectOne((r) => r.url === `${base}/pipelines/runs`);
    expect(req.request.params.get('status')).toBe('success');
    expect(req.request.params.get('branch')).toBe('main');
    expect(req.request.params.get('limit')).toBe('25');
    expect(req.request.params.get('repositoryId')).toBe('r1');
    req.flush({ runs: [], total: 0 });
  });

  it('skips null/undefined query params', () => {
    svc.listRuns({ status: undefined, branch: null as never }).subscribe();
    const req = http.expectOne((r) => r.url === `${base}/pipelines/runs`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ runs: [], total: 0 });
  });

  it('GETs /pipelines/runs/:id', () => {
    svc.getRun('abc-123').subscribe();
    const req = http.expectOne(`${base}/pipelines/runs/abc-123`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('GETs /pipelines/stats', () => {
    svc.getStats().subscribe();
    const req = http.expectOne(`${base}/pipelines/stats`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('POSTs /pipelines/sync with empty body when no integrationId provided', () => {
    svc.syncAll().subscribe();
    const req = http.expectOne(`${base}/pipelines/sync`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ integrations: 1, repositories: 0, runs: 0 });
  });

  it('POSTs /pipelines/sync with the given integrationId', () => {
    svc.syncAll('int-1').subscribe();
    const req = http.expectOne(`${base}/pipelines/sync`);
    expect(req.request.body).toEqual({ integrationId: 'int-1' });
    req.flush({ integrations: 1, repositories: 0, runs: 0 });
  });

  it('GETs /pipelines/repositories/:id/branches', () => {
    svc.listBranches('repo-1').subscribe();
    const req = http.expectOne(`${base}/pipelines/repositories/repo-1/branches`);
    expect(req.request.method).toBe('GET');
    req.flush(['main', 'develop']);
  });

  it('POSTs /pipelines/runs/:id/rerun', () => {
    svc.rerunRun('run-9').subscribe();
    const req = http.expectOne(`${base}/pipelines/runs/run-9/rerun`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ runId: 'run-9', status: 'queued' });
  });
});
