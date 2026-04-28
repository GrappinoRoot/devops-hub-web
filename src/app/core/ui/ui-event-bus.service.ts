import { Injectable } from '@angular/core';
import { Observable, Subject, filter } from 'rxjs';
import type { UiEvent } from '@devops-hub/contracts';

/**
 * Page-scoped event bus for the matrioska renderer.
 * Events are emitted by leaf nodes (e.g. a button click) and handlers
 * declared on ancestors via `UiNode.on` subscribe by event name.
 */
@Injectable()
export class UiEventBusService {
  private readonly subject = new Subject<UiEvent>();

  emit<T = unknown>(name: string, sourceId: string, payload?: T): void {
    this.subject.next({ name, sourceId, payload, ts: Date.now() });
  }

  on<T = unknown>(name: string): Observable<UiEvent<T>> {
    return this.subject
      .asObservable()
      .pipe(filter((e): e is UiEvent<T> => e.name === name));
  }

  stream(): Observable<UiEvent> {
    return this.subject.asObservable();
  }
}
