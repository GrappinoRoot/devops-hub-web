import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { UiSchemaEnvelope } from '@devops-hub/contracts';
import { ApiUrlService } from '../api/api-url.service';

@Injectable({ providedIn: 'root' })
export class UiSchemaService {
  private readonly http = inject(HttpClient);
  private readonly url = inject(ApiUrlService);

  getView(view: string): Observable<UiSchemaEnvelope> {
    return this.http.get<UiSchemaEnvelope>(this.url.build(`/ui-schema/${view}`));
  }
}
