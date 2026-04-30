import { TestBed } from '@angular/core/testing';
import { ApiUrlService } from './api-url.service';
import { environment } from '../../../environments/environment';

describe('ApiUrlService', () => {
  let svc: ApiUrlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ApiUrlService);
  });

  it('returns the configured base URL', () => {
    expect(svc.base()).toBe(environment.apiBaseUrl);
  });

  it('appends a plain path under the API base', () => {
    expect(svc.build('/pipelines/runs')).toBe(`${environment.apiBaseUrl}/pipelines/runs`);
  });

  it('strips the /api prefix to avoid duplication', () => {
    expect(svc.build('/api/pipelines/runs')).toBe(`${environment.apiBaseUrl}/pipelines/runs`);
  });

  it('treats /api as a bare prefix without leaving a trailing slash', () => {
    expect(svc.build('/api')).toBe(`${environment.apiBaseUrl}/`);
  });

  it('does not strip /apiX (not a real /api segment)', () => {
    expect(svc.build('/api-keys')).toBe(`${environment.apiBaseUrl}/api-keys`);
  });

  it('returns absolute http(s) URLs unchanged', () => {
    expect(svc.build('http://example.com/x')).toBe('http://example.com/x');
    expect(svc.build('https://api.github.com/repos/o/r')).toBe(
      'https://api.github.com/repos/o/r',
    );
  });

  it('inserts a slash for paths without a leading slash', () => {
    expect(svc.build('pipelines/runs')).toBe(`${environment.apiBaseUrl}/pipelines/runs`);
  });
});
