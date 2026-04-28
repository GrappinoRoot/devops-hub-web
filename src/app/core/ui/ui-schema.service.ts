import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { UiSchemaEnvelope } from '@devops-hub/contracts';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UiSchemaService {
  private readonly http = inject(HttpClient);

  getView(view: string): Observable<UiSchemaEnvelope> {
    return this.http.get<UiSchemaEnvelope>(`${environment.apiBaseUrl}/ui-schema/${view}`);
  }
}
