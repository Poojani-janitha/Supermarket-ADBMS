import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { Employee, EmployeeAuditLog, SecurityEventLog, BackupInfo, DatabaseAccount } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);

  // JWT Token Signal
  readonly token = signal<string | null>(typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);

  // Database Backup snapshots (Member 5: PITR & Disaster Recovery)
  readonly backups = signal<BackupInfo[]>([]);

  // Live Database Signals (Loaded from MySQL employee, employee_audit_log, security_event_log)
  readonly employees = signal<Employee[]>([]);
  readonly employeeAuditLogs = signal<EmployeeAuditLog[]>([]);
  readonly securityLogs = signal<SecurityEventLog[]>([]);

  // Member 5: Security alert modal signal for unauthorized action guard
  readonly securityAlert = signal<{
    open: boolean;
    title: string;
    message: string;
    role: string;
    objectName: string;
    action: string;
  } | null>(null);

  private getInitialUser(): Employee {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.username && parsed.role) {
            return parsed;
          }
        } catch (e) {
          console.error('Failed to parse user from localStorage', e);
        }
      }
    }
    return {
      employeeId: 1,
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      fullName: 'System Administrator',
      role: 'ADMIN',
      username: 'admin',
      hireDate: '2026-01-01',
      isActive: true
    };
  }

  // Current active user signal (restored from localStorage if available)
  readonly currentUser = signal<Employee>(this.getInitialUser());

  setCurrentUser(user: Employee): void {
    this.currentUser.set(user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  // Switch between demo accounts during viva presentation
  switchUser(role: 'CASHIER' | 'MANAGER' | 'ADMIN' | 'SUPPLIER'): void {
    const user = this.employees().find(u => u.role === role);
    if (user) {
      this.setCurrentUser(user);
    }
  }

  isCashier(): boolean {
    return this.currentUser().role === 'CASHIER';
  }

  isManager(): boolean {
    return this.currentUser().role === 'MANAGER' || this.currentUser().role === 'ADMIN';
  }

  isAdmin(): boolean {
    return this.currentUser().role === 'ADMIN';
  }

  isSupplier(): boolean {
    return this.currentUser().role === 'SUPPLIER';
  }

  // Member 5: sp_change_user_role simulation with trg_employee_audit firing
  changeUserRole(employeeId: number, newRole: 'ADMIN' | 'MANAGER' | 'CASHIER'): { success: boolean; message: string } {
    const emp = this.employees().find(e => e.employeeId === employeeId);
    if (!emp) return { success: false, message: 'Employee not found.' };

    const oldRole = emp.role;
    if (oldRole === newRole) return { success: false, message: 'Employee already has this role.' };

    // Update employee table
    this.employees.update(list =>
      list.map(e => e.employeeId === employeeId ? { ...e, role: newRole } : e)
    );

    // Simulate trg_employee_audit trigger firing
    const auditEntry: EmployeeAuditLog = {
      logId: this.employeeAuditLogs().length + 1,
      employeeId,
      employeeName: emp.fullName,
      action: 'ROLE_CHANGE',
      oldValue: oldRole,
      newValue: newRole,
      modifiedBy: this.currentUser().username,
      modifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.employeeAuditLogs.update(prev => [auditEntry, ...prev]);

    // Record in security_event_log
    const secEntry: SecurityEventLog = {
      logId: this.securityLogs().length + 1,
      eventType: 'ROLE_ASSIGN',
      description: `Role altered from ${oldRole} to ${newRole} for ${emp.fullName}`,
      username: this.currentUser().username,
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.securityLogs.update(prev => [secEntry, ...prev]);

    return { success: true, message: `Successfully updated ${emp.fullName}'s role to ${newRole}. Recorded in employee_audit_log via trg_employee_audit.` };
  }

  // Member 5: sp_deactivate_employee simulation with self-lockout prevention
  deactivateEmployee(employeeId: number): { success: boolean; message: string } {
    // Self-lockout prevention rule
    if (this.currentUser().employeeId === employeeId) {
      return { success: false, message: 'Safety Constraint: sp_deactivate_employee blocks self-lockout! You cannot deactivate your own active session.' };
    }

    const emp = this.employees().find(e => e.employeeId === employeeId);
    if (!emp) return { success: false, message: 'Employee not found.' };

    // Update isActive to false
    this.employees.update(list =>
      list.map(e => e.employeeId === employeeId ? { ...e, isActive: false } : e)
    );

    // Record in audit log via trg_employee_audit
    const auditEntry: EmployeeAuditLog = {
      logId: this.employeeAuditLogs().length + 1,
      employeeId,
      employeeName: emp.fullName,
      action: 'DEACTIVATE',
      oldValue: 'ACTIVE (1)',
      newValue: 'DEACTIVATED (0)',
      modifiedBy: this.currentUser().username,
      modifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.employeeAuditLogs.update(prev => [auditEntry, ...prev]);

    // Record security log
    const secEntry: SecurityEventLog = {
      logId: this.securityLogs().length + 1,
      eventType: 'EMPLOYEE_DEACTIVATED',
      description: `Account deactivated for ${emp.fullName} (#${emp.employeeId})`,
      username: this.currentUser().username,
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.securityLogs.update(prev => [secEntry, ...prev]);

    return { success: true, message: `Employee ${emp.fullName} successfully deactivated. Database session revoked.` };
  }

  reactivateEmployee(employeeId: number): void {
    const emp = this.employees().find(e => e.employeeId === employeeId);
    if (!emp) return;

    this.employees.update(list =>
      list.map(e => e.employeeId === employeeId ? { ...e, isActive: true } : e)
    );

    const auditEntry: EmployeeAuditLog = {
      logId: this.employeeAuditLogs().length + 1,
      employeeId,
      employeeName: emp.fullName,
      action: 'REACTIVATE',
      oldValue: 'DEACTIVATED (0)',
      newValue: 'ACTIVE (1)',
      modifiedBy: this.currentUser().username,
      modifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.employeeAuditLogs.update(prev => [auditEntry, ...prev]);
  }

  // Member 5: fn_check_password_strength UDF simulation
  checkPasswordStrength(pwd: string): { score: number; label: string; valid: boolean } {
    if (!pwd) return { score: 0, label: 'Empty', valid: false };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: 'Weak', valid: false };
    if (score === 3 || score === 4) return { score, label: 'Medium', valid: true };
    return { score, label: 'Strong (Enterprise Compliant)', valid: true };
  }

  // Member 5: Register new employee & provision system user account
  registerEmployee(data: {
    fullName: string;
    branchId: number;
    branchName: string;
    role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'SUPPLIER';
    username: string;
    password: string;
  }): { success: boolean; message: string } {
    if (!data.fullName || !data.username || !data.password) {
      return { success: false, message: 'All fields are required to provision an employee account.' };
    }

    // Check unique username constraint
    if (this.employees().some(e => e.username.toLowerCase() === data.username.toLowerCase())) {
      return { success: false, message: `Integrity Constraint: Username '${data.username}' is already taken in the employee table.` };
    }

    // Check password strength using fn_check_password_strength UDF
    const pwdRes = this.checkPasswordStrength(data.password);
    if (!pwdRes.valid) {
      return { success: false, message: `Security Constraint (fn_check_password_strength): Password is too weak (${pwdRes.label}). Must meet enterprise complexity requirements.` };
    }

    const newId = Math.max(0, ...this.employees().map(e => e.employeeId)) + 1;
    const newEmp: Employee = {
      employeeId: newId,
      branchId: data.branchId,
      branchName: data.branchName,
      fullName: data.fullName,
      role: data.role,
      username: data.username,
      hireDate: new Date().toISOString().split('T')[0],
      isActive: true
    };

    this.employees.update(prev => [...prev, newEmp]);

    // Record in employee_audit_log via trg_employee_audit
    const auditEntry: EmployeeAuditLog = {
      logId: this.employeeAuditLogs().length + 1,
      employeeId: newId,
      employeeName: data.fullName,
      action: 'REGISTER',
      oldValue: 'NONE',
      newValue: `${data.role} @ ${data.branchName}`,
      modifiedBy: this.currentUser().username,
      modifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.employeeAuditLogs.update(prev => [auditEntry, ...prev]);

    // Record in security_event_log
    const secEntry: SecurityEventLog = {
      logId: this.securityLogs().length + 1,
      eventType: 'EMPLOYEE_REGISTERED',
      description: `Staff user '${data.username}' (#${newId}) provisioned with role: ${data.role}_role`,
      username: this.currentUser().username,
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.securityLogs.update(prev => [secEntry, ...prev]);

    return { success: true, message: `Employee '${data.fullName}' successfully registered with role ${data.role}_ROLE!` };
  }

  // Member 5: sp_get_login simulation
  login(username: string): boolean {
    const user = this.employees().find(u => u.username === username);
    if (user && user.isActive) {
      this.setCurrentUser(user);
      return true;
    }
    return false;
  }

  // Token Management (Member 5)
  getToken(): string | null {
    return this.token() || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
  }

  setToken(token: string): void {
    this.token.set(token);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken(): void {
    this.token.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  logout(): void {
    this.clearToken();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('user');
    }
    this.currentUser.set(this.employees()[0]);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Real REST API integration connecting to Spring Boot backend
  loginApi(username: string, password: string): Observable<any> {
    return this.http.post<any>('/api/auth/login', { username, password }).pipe(
      tap(res => {
        if (res && res.token) {
          this.setToken(res.token);
          if (res.user) {
            const userObj: Employee = {
              employeeId: res.user.employeeId,
              branchId: res.user.branchId || 1,
              branchName: res.user.branchName || ('Branch #' + (res.user.branchId || 1)),
              fullName: res.user.fullName,
              role: res.user.role,
              username: res.user.username,
              hireDate: new Date().toISOString().split('T')[0],
              isActive: res.user.isActive,
              supplierId: res.user.supplierId
            };
            this.setCurrentUser(userObj);
          }
        }
      })
    );
  }

  registerSupplierHttp(supplierData: any): Observable<any> {
    return this.http.post<any>('/api/auth/supplier/signup', supplierData);
  }

  // Member 5: Red Warning Style Security Violation Trigger
  triggerSecurityAlert(objectName: string, action: string, customMessage?: string): void {
    const current = this.currentUser();
    const msg = customMessage || `Action Prohibited: Your active role '${current.role}' is not granted privilege '${action}' on database object '${objectName}'.`;
    this.securityAlert.set({
      open: true,
      title: 'SECURITY VIOLATION: ACCESS DENIED',
      message: msg,
      role: current.role,
      objectName,
      action
    });

    const secEntry: SecurityEventLog = {
      logId: this.securityLogs().length + 1,
      eventType: 'UNAUTHORIZED_ACCESS',
      description: `Access violation attempt by user '${current.username}' (${current.role}_ROLE) targeting '${objectName}' with action '${action}'`,
      username: current.username,
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.securityLogs.update(prev => [secEntry, ...prev]);
  }

  closeSecurityAlert(): void {
    this.securityAlert.set(null);
  }

  fetchRolesHttp(): Observable<string[]> {
    return this.http.get<string[]>('/api/admin/roles').pipe(
      catchError(() => of(['ADMIN', 'MANAGER', 'CASHIER', 'SUPPLIER']))
    );
  }

  fetchObjectsHttp(): Observable<any[]> {
    return this.http.get<any[]>('/api/admin/objects').pipe(
      catchError(() => of([]))
    );
  }

  fetchRolePrivilegesHttp(role?: string): Observable<any[]> {
    const url = role ? `/api/admin/privileges?role=${role}` : '/api/admin/privileges';
    return this.http.get<any[]>(url).pipe(
      catchError(() => of([]))
    );
  }

    provisionDatabaseAccountHttp(payload: { username: string; host?: string; role?: string; password?: string }): Observable<DatabaseAccount> {
    return this.http.post<DatabaseAccount>('/api/admin/database-accounts', payload);
  }

  saveRolePrivilegesHttp(role: string, rules: any[]): Observable<any> {
    return this.http.post('/api/admin/privileges', { role, rules });
  }

  fetchEmployeesHttp(): Observable<Employee[]> {
    return this.http.get<Employee[]>('/api/admin/employees').pipe(
      tap(data => this.employees.set(data || [])),
      catchError(() => {
        this.employees.set([]);
        return of([]);
      })
    );
  }

  fetchAuditLogsHttp(): Observable<EmployeeAuditLog[]> {
    return this.http.get<any[]>('/api/admin/audit-logs').pipe(
      map(logs => (logs || []).map((l: any) => ({
        logId: l.logId,
        employeeId: l.employeeId,
        employeeName: l.employeeName,
        action: (l.action || (l.isActiveChanged ? 'DEACTIVATE' : (l.oldRole !== l.newRole ? 'ROLE_CHANGE' : (l.oldBranchName !== l.newBranchName ? 'BRANCH_TRANSFER' : 'REGISTER')))) as any,
        oldValue: l.oldValue || l.oldRole || l.oldBranchName || 'ACTIVE',
        newValue: l.newValue || l.newRole || l.newBranchName || 'DEACTIVATED',
        modifiedBy: l.modifiedBy || l.changedBy || 'SYSTEM',
        modifiedAt: l.modifiedAt || l.changedAt || ''
      }))),
      tap(logs => this.employeeAuditLogs.set(logs || [])),
      catchError(() => {
        this.employeeAuditLogs.set([]);
        return of([]);
      })
    );
  }

  fetchSecurityLogsHttp(): Observable<SecurityEventLog[]> {
    return this.http.get<any[]>('/api/admin/security-logs').pipe(
      map(logs => (logs || []).map((s: any) => ({
        logId: s.logId,
        eventType: s.eventType,
        description: s.description || s.details || '',
        username: s.username || s.performedBy || '',
        ipAddress: s.ipAddress || '127.0.0.1',
        createdAt: s.createdAt || s.loggedAt || ''
      }))),
      tap(logs => this.securityLogs.set(logs || [])),
      catchError(() => {
        this.securityLogs.set([]);
        return of([]);
      })
    );
  }

  fetchMaskedCustomersHttp(): Observable<any[]> {
    return this.http.get<any[]>('/api/admin/masked-customers');
  }

  changeRoleHttp(employeeId: number, role: string): Observable<any> {
    return this.http.put(`/api/admin/employees/${employeeId}/role`, { role });
  }

  deactivateEmployeeHttp(employeeId: number): Observable<any> {
    return this.http.delete(`/api/admin/employees/${employeeId}`);
  }

  reactivateEmployeeHttp(employeeId: number): Observable<any> {
    return this.http.put(`/api/admin/employees/${employeeId}/reactivate`, {});
  }

  registerEmployeeHttp(payload: any): Observable<any> {
    return this.http.post('/api/admin/employees', payload);
  }

  fetchBackupsHttp(): Observable<BackupInfo[]> {
    return this.http.get<BackupInfo[]>('/api/admin/backups').pipe(
      tap(data => {
        if (data) {
          this.backups.set(data);
        }
      }),
      catchError(() => of(this.backups()))
    );
  }

  createBackupHttp(): Observable<BackupInfo> {
    return this.http.post<BackupInfo>('/api/admin/backup', {}).pipe(
      tap(res => {
        if (res) {
          this.backups.update(prev => [res, ...prev.filter(b => b.fileName !== res.fileName)]);
        }
      })
    );
  }

  downloadBackup(fileName: string): Observable<Blob> {
    return this.http.get(`/api/admin/backup/download/${fileName}`, { responseType: 'blob' });
  }

  restoreBackupHttp(fileName: string): Observable<any> {
    return this.http.post(`/api/admin/backup/restore/${fileName}`, {});
  }
}
