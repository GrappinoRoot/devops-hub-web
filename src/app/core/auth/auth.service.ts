import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, firstValueFrom, shareReplay, tap } from 'rxjs';
import type {
  AuthResponse,
  AuthTokens,
  LoginDto,
  RegisterDto,
} from '@devops-hub/contracts';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'devops-hub.auth';

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
  userId: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _state = signal<StoredAuth | null>(this.readFromStorage());
  readonly state = this._state.asReadonly();
  readonly isAuthenticated = computed(() => this._state() !== null);
  readonly tenantId = computed(() => this._state()?.tenantId ?? null);
  readonly accessToken = computed(() => this._state()?.accessToken ?? null);

  constructor(private readonly http: HttpClient) {}

  async login(body: LoginDto): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, body),
    );
    this.persist(res);
  }

  async register(body: RegisterDto): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/register`, body),
    );
    this.persist(res);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._state.set(null);
  }

  /** Returns the current refresh token, or null if not authenticated. */
  refreshToken(): string | null {
    return this._state()?.refreshToken ?? null;
  }

  private inFlightRefresh: Observable<AuthTokens> | null = null;

  /**
   * Performs a token refresh against the API. Multiple concurrent callers will
   * share the same in-flight request; resets once the request settles.
   */
  refresh$(): Observable<AuthTokens> {
    if (this.inFlightRefresh) return this.inFlightRefresh;
    const token = this.refreshToken();
    if (!token) {
      throw new Error('No refresh token available');
    }
    this.inFlightRefresh = this.http
      .post<AuthTokens>(`${environment.apiBaseUrl}/auth/refresh`, {
        refreshToken: token,
      })
      .pipe(
        tap((tokens) => this.applyTokens(tokens)),
        finalize(() => (this.inFlightRefresh = null)),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    return this.inFlightRefresh;
  }

  private applyTokens(tokens: AuthTokens): void {
    const current = this._state();
    if (!current) return;
    const updated: StoredAuth = {
      ...current,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    this._state.set(updated);
  }

  private persist(res: AuthResponse): void {
    const stored: StoredAuth = {
      accessToken: res.tokens.accessToken,
      refreshToken: res.tokens.refreshToken,
      tenantId: res.user.tenantId,
      userId: res.user.id,
      email: res.user.email,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    this._state.set(stored);
  }

  private readFromStorage(): StoredAuth | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredAuth;
    } catch {
      return null;
    }
  }
}
