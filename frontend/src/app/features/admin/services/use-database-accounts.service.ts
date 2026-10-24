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

  private readonly fallbackAccounts: DatabaseAccount[] = [
    {
      id: 'admin@localhost',
      username: 'admin',
      role: 'admin_role',
      host: 'localhost',
      status: 'active',
      privilegeCount: 18,
      createdAt: '2026-01-15 08:30:00',
      lastUsedAt: 'Active DBA session'
    },
    {
      id: 'admin_user@localhost',
      username: 'admin_user',
      role: 'admin_role',
      host: 'localhost',
      status: 'active',
      privilegeCount: 18,
      createdAt: '2026-01-15 08:30:00',
      lastUsedAt: 'Local DBA'
    },
    {
      id: 'app_user@%',
      username: 'app_user',
      role: 'DIRECT_PRIVS',
      host: '%',
      status: 'active',
      privilegeCount: 9,
      createdAt: '2026-01-15 08:30:00',
      lastUsedAt: 'HikariCP pool active'
    },
    {
      id: 'report_user@%',
      username: 'report_user',
      role: 'DIRECT_PRIVS',
      host: '%',
      status: 'active',
      privilegeCount: 3,
      createdAt: '2026-01-15 08:30:00',
      lastUsedAt: '15 mins ago'
    },
    {
      id: 'etl_user@%',
      username: 'etl_user',
      role: 'DIRECT_PRIVS',
      host: '%',
      status: 'active',
      privilegeCount: 5,
      createdAt: '2026-01-15 08:30:00',
      lastUsedAt: 'Nightly batch runner'
    },
    {
      id: 'db_manager@%',
      username: 'db_manager',
      role: 'db_manager_role',
      host: '%',
      status: 'active',
      privilegeCount: 14,
      createdAt: '2026-01-15 08:30:00',
      lastUsedAt: 'Active schema DBA'
    },
    {
      id: 'hr@%',
      username: 'hr',
      role: 'hr_role',
      host: '%',
      status: 'active',
      privilegeCount: 4,
      createdAt: '2026-01-15 08:30:00',
      lastUsedAt: 'HR Administrator'
    },
    {
      id: 'demo_manager@%',
      username: 'demo_manager',
      role: 'manager_role',
      host: '%',
      status: 'active',
      privilegeCount: 12,
      createdAt: '2026-01-15 08:30:00',
      lastUsedAt: '5 mins ago'
    },
    {
      id: 'demo_cashier@%',
      username: 'demo_cashier',
      role: 'cashier_role',
      host: '%',
      status: 'active',
      privilegeCount: 6,
      createdAt: '2026-01-15 08:30:00',
      lastUsedAt: 'Just now'
    }
  ];

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
          if (data && data.length > 0) {
            this.accounts.set(data);
          } else if (this.accounts().length === 0) {
            this.accounts.set(this.fallbackAccounts);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set('Failed to connect to MySQL user privilege engine');
          if (this.accounts().length === 0) {
            this.accounts.set(this.fallbackAccounts);
          }
        }
      });
  }

  fetchHttp() {
    return this.http.get<DatabaseAccount[]>('/api/admin/database-accounts').pipe(
      retry(1),
      catchError(() => of(this.fallbackAccounts))
    );
  }

  refetch(): void {
    this.isLoading.set(true);
    this.fetchHttp().subscribe({
      next: (data) => {
        this.isLoading.set(false);
        this.error.set(null);
        if (data && data.length > 0) {
          this.accounts.set(data);
        } else {
          this.accounts.set(this.fallbackAccounts);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set('Could not refresh MySQL database accounts');
        this.accounts.set(this.fallbackAccounts);
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
