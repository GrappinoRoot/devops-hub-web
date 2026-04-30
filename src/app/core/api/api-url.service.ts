import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Builds absolute URLs for the backend API. Centralizes the `/api` prefix
 * handling so callers can pass either a leading-slash relative path
 * (`/pipelines/runs`) or a schema-style path (`/api/pipelines/runs`).
 */
@Injectable({ providedIn: 'root' })
export class ApiUrlService {
  /** Returns the configured API base URL (e.g. `http://localhost:3000/api`). */
  base(): string {
    return environment.apiBaseUrl;
  }

  /**
   * Build an absolute URL for the given path. Accepts:
   *  - Already absolute URL (`http(s)://...`) → returned as-is.
   *  - `/api/...` prefixed path → strips the `/api` to avoid duplication.
   *  - `/...` plain path → appended after `apiBaseUrl`.
   */
  build(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    const cleaned = path.replace(/^\/api(\/|$)/, '/');
    const sep = cleaned.startsWith('/') ? '' : '/';
    return `${environment.apiBaseUrl}${sep}${cleaned}`;
  }
}
