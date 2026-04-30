import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extracts a user-friendly message from an arbitrary error thrown by the
 * HttpClient or other async operations. Prefers backend-provided messages
 * (NestJS standard `{statusCode, message}` envelope) and falls back to a
 * generic string when nothing useful is available.
 */
@Injectable({ providedIn: 'root' })
export class ErrorMessageService {
  format(err: unknown, fallback = 'Unexpected error'): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { message?: string | string[] } | string | null;
      if (typeof body === 'string' && body.length > 0) return body;
      if (body && typeof body === 'object') {
        const msg = body.message;
        if (Array.isArray(msg) && msg.length > 0) return msg.join('; ');
        if (typeof msg === 'string' && msg.length > 0) return msg;
      }
      if (err.status === 0) return 'Network error: API unreachable';
      return `${err.status} ${err.statusText || 'Request failed'}`;
    }
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return fallback;
  }
}
