import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timer, switchMap, catchError, of, retry } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatabaseAccount } from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class DatabaseAccountsService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly accounts = signal<DatabaseAccount[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.initRealtimePolling();
  }

  private initRealtimePolling(): void {
    // Poll every 10 seconds for real-time status updates
    timer(0, 10000)
      .pipe(
        switchMap(() => {
          if (this.accounts().length === 0) {
            this.isLoading.set(true);
          }
          return this.fetchHttp();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          this.isLoading.set(false);
          this.error.set(null);
          this.accounts.set(data || []);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set('Failed to connect to MySQL user privilege engine');
        }
      });
  }

  fetchHttp() {
    return this.http.get<DatabaseAccount[]>('/api/admin/database-accounts').pipe(
      retry(1),
      catchError(() => of([]))
    );
  }

  refetch(): void {
    this.isLoading.set(true);
    this.fetchHttp().subscribe({
      next: (data) => {
        this.isLoading.set(false);
        this.error.set(null);
        this.accounts.set(data || []);
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set('Could not refresh MySQL database accounts');
        this.accounts.set([]);
      }
    });
  }
}

export function useDatabaseAccounts() {
  const service = inject(DatabaseAccountsService);
  return {
    accounts: service.accounts,
    isLoading: service.isLoading,
    error: service.error,
    refresh: () => service.refetch(),
    refetch: () => service.refetch()
  };
}
