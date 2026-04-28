import { Injectable, signal } from '@angular/core';

export type ToastLevel = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  level: ToastLevel;
  message: string;
}

const DEFAULT_DURATION_MS = 4000;

/**
 * App-wide toast notifications. Components subscribe to `toasts()` to render,
 * actions and services call `show()` to push a new entry. Auto-dismiss after
 * a short timeout; users can also click to dismiss early.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(level: ToastLevel, message: string, durationMs = DEFAULT_DURATION_MS): void {
    const id = this.nextId++;
    this._toasts.update((list) => [...list, { id, level, message }]);
    if (durationMs > 0) {
      setTimeout(() => this.dismiss(id), durationMs);
    }
  }

  info(message: string, durationMs?: number): void {
    this.show('info', message, durationMs);
  }
  success(message: string, durationMs?: number): void {
    this.show('success', message, durationMs);
  }
  error(message: string, durationMs?: number): void {
    this.show('error', message, durationMs);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
