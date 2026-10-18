import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { Employee, EmployeeAuditLog, SecurityEventLog } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);

  // JWT Token Signal
  readonly token = signal<string | null>(typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);

  // Staff directory simulating employee table
  readonly employees = signal<Employee[]>([
    {
      employeeId: 101,
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      fullName: 'Floyd Miles',
      role: 'CASHIER',
      username: 'cashier_floyd',
      hireDate: '2024-03-15',
      isActive: true
    },
    {
      employeeId: 102,
      branchId: 1,
      branchName: 'Colombo Central Flagship',
      fullName: 'Arlene McCoy',
      role: 'MANAGER',
      username: 'manager_arlene',
      hireDate: '2022-01-10',
      isActive: true
    },
    {
      employeeId: 100,
      branchId: 1,
      branchName: 'Headquarters / All Branches',
      fullName: 'Kavindu Perera (Admin)',
      role: 'ADMIN',
      username: 'admin_kavindu',
      hireDate: '2021-08-01',
      isActive: true
    },
    {
      employeeId: 103,
      branchId: 2,
      branchName: 'Kandy City Centre Branch',
      fullName: 'Kamal Gunaratne',
      role: 'CASHIER',
      username: 'cashier_kamal',
      hireDate: '2023-06-20',
      isActive: true
    },
    {
      employeeId: 104,
      branchId: 3,
      branchName: 'Galle Fort Supermarket',
      fullName: 'Nimal Silva',
      role: 'MANAGER',
      username: 'manager_nimal',
      hireDate: '2022-11-05',
      isActive: true
    },
    {
      employeeId: 201,
      branchId: 1,
      branchName: 'Headquarters Vendor Network',
      fullName: 'Sunil Bandara (Lanka Fresh Organics)',
      role: 'SUPPLIER',
      username: 'supplier_organics',
      hireDate: '2023-01-15',
      isActive: true,
      supplierId: 1
    },
    {
      employeeId: 202,
      branchId: 1,
      branchName: 'Headquarters Vendor Network',
      fullName: 'Anura Jayasuriya (Ceylon Agro Mills)',
      role: 'SUPPLIER',
      username: 'supplier_agro',
      hireDate: '2023-04-10',
      isActive: true,
      supplierId: 2
    }
  ]);

  // Current active user signal (Defaults to Floyd Miles as shown in Pinterest SS)
  readonly currentUser = signal<Employee>(this.employees()[0]);

  // Member 5: Audit log automatically maintained via trg_employee_audit
  readonly employeeAuditLogs = signal<EmployeeAuditLog[]>([
    {
      logId: 1,
      employeeId: 101,
      employeeName: 'Floyd Miles',
      action: 'ROLE_CHANGE',
      oldValue: 'TRAINEE',
      newValue: 'CASHIER',
      modifiedBy: 'admin_kavindu',
      modifiedAt: '2026-10-01 09:14:00'
    },
    {
      logId: 2,
      employeeId: 102,
      employeeName: 'Arlene McCoy',
      action: 'BRANCH_TRANSFER',
      oldValue: 'Branch 2 (Kandy)',
      newValue: 'Branch 1 (Colombo Central)',
      modifiedBy: 'admin_kavindu',
      modifiedAt: '2026-10-03 14:22:15'
    }
  ]);

  // Member 5: Security event log
  readonly securityLogs = signal<SecurityEventLog[]>([
    {
      logId: 1,
      eventType: 'LOGIN_SUCCESS',
      description: 'Authentication succeeded via sp_get_login',
      username: 'cashier_floyd',
      ipAddress: '192.168.1.104',
      createdAt: '2026-10-10 08:30:12'
    },
    {
      logId: 2,
      eventType: 'ROLE_ASSIGN',
      description: 'Activated cashier_role in MySQL session',
      username: 'cashier_floyd',
      ipAddress: '192.168.1.104',
      createdAt: '2026-10-10 08:30:13'
    },
    {
      logId: 3,
      eventType: 'LOGIN_SUCCESS',
      description: 'Manager login verified with BCrypt hash',
      username: 'manager_arlene',
      ipAddress: '192.168.1.102',
      createdAt: '2026-10-10 09:15:40'
    }
  ]);

  // Switch between demo accounts during viva presentation
  switchUser(role: 'CASHIER' | 'MANAGER' | 'ADMIN' | 'SUPPLIER'): void {
    const user = this.employees().find(u => u.role === role);
    if (user) {
      this.currentUser.set(user);
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
      this.currentUser.set(user);
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
            this.currentUser.set({
              employeeId: res.user.employeeId,
              branchId: res.user.branchId,
              branchName: 'Branch #' + res.user.branchId,
              fullName: res.user.fullName,
              role: res.user.role,
              username: res.user.username,
              hireDate: new Date().toISOString().split('T')[0],
              isActive: res.user.isActive
            });
          }
        }
      })
    );
  }

  fetchEmployeesHttp(): Observable<Employee[]> {
    return this.http.get<Employee[]>('/api/admin/employees').pipe(
      tap(data => {
        if (data && data.length > 0) {
          this.employees.set(data);
        }
      }),
      catchError(() => of(this.employees()))
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
      tap(logs => {
        if (logs && logs.length > 0) {
          this.employeeAuditLogs.set(logs);
        }
      }),
      catchError(() => of(this.employeeAuditLogs()))
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
      tap(logs => {
        if (logs && logs.length > 0) {
          this.securityLogs.set(logs);
        }
      }),
      catchError(() => of(this.securityLogs()))
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
}
