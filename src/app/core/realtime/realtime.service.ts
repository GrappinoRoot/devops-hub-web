import { Injectable, OnDestroy, effect, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import type { RtChannel, RtEvent } from '@devops-hub/contracts';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private socket: Socket | null = null;
  private readonly events$ = new Subject<RtEvent>();

  constructor() {
    effect(() => {
      const token = this.auth.accessToken();
      this.disconnect();
      if (token) this.connect(token);
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  on<T>(channel: RtChannel, type: string) {
    const sub = new Subject<RtEvent<T>>();
    const handler = (ev: RtEvent) => {
      if (ev.channel === channel && ev.type === type) sub.next(ev as RtEvent<T>);
    };
    const subscription = this.events$.subscribe(handler);
    return {
      stream: sub.asObservable(),
      unsubscribe: () => {
        subscription.unsubscribe();
        sub.complete();
      },
    };
  }

  private connect(token: string): void {
    this.socket = io(environment.wsUrl, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });
    this.socket.onAny((type: string, payload: RtEvent) => {
      if (payload && typeof payload === 'object' && 'channel' in payload) {
        this.events$.next(payload);
      }
    });
  }

  private disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
