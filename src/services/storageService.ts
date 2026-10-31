import { 
  StudentProfile, 
  Announcement, 
  OfficerRequest, 
  AuditLogEntry, 
  TeamFormation, 
  SystemSettings, 
  UserAccount,
  RequestStatus,
  Department,
  AcademicYear,
  SupportTicket,
  PendingAccountRequest
} from '../types';
import { INITIAL_STUDENTS } from '../data/initialStudents';
import { 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_REQUESTS, 
  INITIAL_STAFF_ACCOUNTS, 
  INITIAL_AUDIT_LOGS, 
  DEFAULT_SYSTEM_SETTINGS 
} from '../data/initialData';

const STORAGE_KEYS = {
  STUDENTS: 'civil_connect_students',
  ANNOUNCEMENTS: 'civil_connect_announcements',
  REQUESTS: 'civil_connect_requests',
  STAFF_ACCOUNTS: 'civil_connect_staff',
  AUDIT_LOGS: 'civil_connect_audit_logs',
  TEAMS: 'civil_connect_teams',
  SETTINGS: 'civil_connect_settings',
  SUPPORT_TICKETS: 'civil_connect_support_tickets',
  ACCOUNT_REQUESTS: 'civil_connect_account_requests',
  INITIALIZED: 'civil_connect_initialized_clean_v5'
};

// Calculate profile completion percentage (0% for fresh accounts until filled)
export function calculateProfileCompletion(student: Partial<StudentProfile>): number {
  let score = 0;

  // Section 1: Personal Skills (25%)
  if (student.skills && student.skills.strongestSkills && student.skills.strongestSkills.length > 0) {
    score += 25;
  }

  // Section 2: Interests & Focus Areas (25%)
  if (student.interests && student.interests.activities && student.interests.activities.length > 0) {
    score += 25;
  }

  // Section 3: Team Strengths & Logistics (25%)
  if (student.teamStrengths && student.teamStrengths.roles && student.teamStrengths.roles.length > 0) {
    score += 25;
  }

  // Section 4: Team Formation Preferences (25%)
  if (student.teamPreferences && (student.teamPreferences.preferredRole || student.teamPreferences.preferredTechnicalDomain)) {
    score += 25;
  }

  return Math.min(100, score);
}

class StorageService {
  constructor() {
    this.initDefaults();
  }

  private initDefaults() {
    try {
      const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
      if (initialized !== 'civil_connect_initialized_clean_v5') {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(INITIAL_STAFF_ACCOUNTS));
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
        localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SYSTEM_SETTINGS));
        localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'civil_connect_initialized_clean_v5');
      }
    } catch (e) {
      console.error('Storage initialization failed', e);
    }
  }

  // --- Students Management ---
  public async getStudents(includeArchived = false): Promise<StudentProfile[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      let students: StudentProfile[] = [];
      if (!data) {
        students = INITIAL_STUDENTS;
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      } else {
        students = JSON.parse(data);
        if (!Array.isArray(students) || students.length === 0) {
          students = INITIAL_STUDENTS;
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
        }
      }
      
      // Sync persistent user avatars and purge legacy placeholder paths
      if (Array.isArray(students)) {
        let changed = false;
        students.forEach(s => {
          // Explicit cleanup: Remove accidental assignment of Harish Pranav's avatar to LACHUNASRI P
          if (
            s.normalizedRegisterNumber === '927625bee062' || 
            s.email.toLowerCase().includes('927625bee062') ||
            s.name.toUpperCase().includes('LACHUNASRI')
          ) {
            if (s.profileImage) {
              s.profileImage = undefined;
              changed = true;
            }
            this.removeUserAvatar('927625bee062');
            this.removeUserAvatar('927625bee062@mkce.ac.in');
            this.removeUserAvatar('927625BEE062');
          } else if (s.profileImage === '/harish_pranav_profile.jpg' || (s.profileImage && s.profileImage.includes('unsplash'))) {
            s.profileImage = this.getSavedAvatar(s.email) || this.getSavedAvatar(s.registerNumber) || undefined;
            changed = true;
          } else if (!s.profileImage) {
            const saved = this.getSavedAvatar(s.email) || this.getSavedAvatar(s.registerNumber);
            if (saved) {
              s.profileImage = saved;
              changed = true;
            }
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
        }
      }

      if (includeArchived) return students;
      return students.filter(s => !s.isArchived);
    } catch {
      return INITIAL_STUDENTS;
    }
  }

  public async getArchivedStudents(): Promise<StudentProfile[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (!data) return [];
      const students: StudentProfile[] = JSON.parse(data);
      return students.filter(s => s.isArchived);
    } catch {
      return [];
    }
  }

  public async getStudentById(identifier: string): Promise<StudentProfile | null> {
    const students = await this.getStudents(true);
    const key = identifier.toLowerCase().trim();
    if (!key) return null;

    const inputDigits = key.replace(/\D/g, '');

    return students.find(s => {
      // 1. Direct register number match (case-insensitive)
      if (
        s.id === key || 
        s.normalizedRegisterNumber === key ||
        s.registerNumber.toLowerCase().trim() === key
      ) {
        return true;
      }

      // 2. Direct email match
      if (
        s.normalizedEmail === key ||
        s.email.toLowerCase().trim() === key
      ) {
        return true;
      }

      // 3. Email prefix matching (e.g. input is 927624bec066 and email is 927624bec066@mkce.ac.in)
      const studentPrefix = s.email.toLowerCase().split('@')[0].trim();
      if (studentPrefix && studentPrefix === key) {
        return true;
      }

      // 4. Input with or without @mkce.ac.in
      if (key.includes('@')) {
        const inputPrefix = key.split('@')[0].trim();
        if (
          s.normalizedRegisterNumber === inputPrefix ||
          s.registerNumber.toLowerCase().trim() === inputPrefix ||
          studentPrefix === inputPrefix
        ) {
          return true;
        }
      } else {
        if (`${key}@mkce.ac.in` === s.email.toLowerCase().trim()) {
          return true;
        }
      }

      // 5. Phone / Mobile Number match (flexible digits check)
      if (inputDigits.length >= 7 && s.phone) {
        const studentPhoneDigits = s.phone.replace(/\D/g, '');
        if (studentPhoneDigits === inputDigits) return true;
        if (inputDigits.length >= 10 && studentPhoneDigits.length >= 10) {
          if (inputDigits.slice(-10) === studentPhoneDigits.slice(-10)) return true;
        }
      }

      return false;
    }) || null;
  }

  public async saveStudent(student: StudentProfile): Promise<StudentProfile> {
    const students = await this.getStudents(true);
    const normKey = student.registerNumber.toLowerCase().trim();
    
    // Auto-calculate completion score
    const completion = calculateProfileCompletion(student);
    const updatedStudent: StudentProfile = {
      ...student,
      id: normKey,
      normalizedRegisterNumber: normKey,
      normalizedEmail: student.email.toLowerCase().trim(),
      profileCompletionPercentage: completion,
      updatedAt: new Date().toISOString()
    };

    const index = students.findIndex(s => s.id === normKey);
    if (index >= 0) {
      students[index] = updatedStudent;
    } else {
      students.push(updatedStudent);
    }

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    if (updatedStudent.profileImage) {
      this.saveUserAvatar(updatedStudent.email, updatedStudent.profileImage);
      this.saveUserAvatar(updatedStudent.registerNumber, updatedStudent.profileImage);
    } else {
      this.removeUserAvatar(updatedStudent.email);
      this.removeUserAvatar(updatedStudent.registerNumber);
    }

    return updatedStudent;
  }

  public async addStudent(record: {
    name: string;
    registerNumber: string;
    email: string;
    phone: string;
    department: Department;
    academicYear: AcademicYear;
    club: string;
    japaneseStudent?: 'Yes' | 'No';
    awsInterested?: 'Yes' | 'No';
  }): Promise<{ success: boolean; message: string; student?: StudentProfile }> {
    const students = await this.getStudents(true);
    const normReg = record.registerNumber.toLowerCase().trim();
    const normEmail = record.email.toLowerCase().trim();

    // Validate uniqueness
    const regExists = students.some(s => s.normalizedRegisterNumber === normReg);
    if (regExists) {
      return { success: false, message: `Register number ${record.registerNumber} already exists.` };
    }

    const emailExists = students.some(s => s.normalizedEmail === normEmail);
    if (emailExists) {
      return { success: false, message: `Email address ${record.email} already exists.` };
    }

    const newStudent: StudentProfile = {
      id: normReg,
      registerNumber: record.registerNumber.toUpperCase().trim(),
      normalizedRegisterNumber: normReg,
      name: record.name.toUpperCase().trim(),
      email: normEmail,
      normalizedEmail: normEmail,
      phone: record.phone.trim(),
      department: record.department,
      academicYear: record.academicYear,
      club: record.club || 'General Student Body',
      japaneseStudent: record.japaneseStudent || 'No',
      awsInterested: record.awsInterested || 'No',
      registrationStatus: 'Active',
      confirmationId: `CONF-${Date.now().toString().slice(-6)}`,
      registrationDate: new Date().toISOString().split('T')[0],
      profileCompletionPercentage: 20,
      profileStatus: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false
    };

    students.push(newStudent);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return { success: true, message: 'Student registered successfully', student: newStudent };
  }

  public async deleteStudent(normalizedRegNo: string, softDelete = true): Promise<boolean> {
    const students = await this.getStudents(true);
    const key = normalizedRegNo.toLowerCase().trim();
    const index = students.findIndex(s => s.id === key);
    if (index === -1) return false;

    if (softDelete) {
      students[index].isArchived = true;
      students[index].archivedAt = new Date().toISOString();
    } else {
      students.splice(index, 1);
    }

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return true;
  }

  public async restoreStudent(normalizedRegNo: string): Promise<boolean> {
    const students = await this.getStudents(true);
    const key = normalizedRegNo.toLowerCase().trim();
    const student = students.find(s => s.id === key);
    if (!student) return false;

    student.isArchived = false;
    delete student.archivedAt;
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return true;
  }

  public async bulkDeleteStudents(normalizedRegNos: string[], softDelete = true): Promise<{ count: number }> {
    const students = await this.getStudents(true);
    const set = new Set(normalizedRegNos.map(s => s.toLowerCase().trim()));
    let count = 0;

    if (softDelete) {
      students.forEach(s => {
        if (set.has(s.id)) {
          s.isArchived = true;
          s.archivedAt = new Date().toISOString();
          count++;
        }
      });
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } else {
      const remaining = students.filter(s => {
        if (set.has(s.id)) {
          count++;
          return false;
        }
        return true;
      });
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(remaining));
    }

    return { count };
  }

  // --- Bulk CSV Import ---
  public async importCSVStudents(rawRows: Record<string, string>[]): Promise<{
    totalProcessed: number;
    successCount: number;
    failedCount: number;
    duplicates: string[];
    errors: { row: number; error: string }[];
  }> {
    const existing = await this.getStudents(true);
    const existingRegNos = new Set(existing.map(s => s.normalizedRegisterNumber));
    const existingEmails = new Set(existing.map(s => s.normalizedEmail));

    const duplicates: string[] = [];
    const errors: { row: number; error: string }[] = [];
    const newStudents: StudentProfile[] = [];

    rawRows.forEach((row, i) => {
      const rowNum = i + 1;
      // Column mappings according to specifications:
      // Name → name, Register Number → registerNumber, Official college mail id → email, Phone → phone,
      // Department → department, Year → academicYear, Japanese Student → japaneseStudent,
      // AWS Interested → awsInterested, Club → club, Status → status, Confirmation ID → confirmationId,
      // Registration Date → registrationDate
      const name = (row['Name'] || row['name'] || '').trim();
      const regNo = (row['Register Number'] || row['registerNumber'] || row['registernumber'] || '').trim();
      const email = (row['Official college mail id'] || row['email'] || row['Official College Mail ID'] || '').trim();
      const phone = (row['Phone'] || row['phone'] || '').trim();
      const dept = (row['Department'] || row['department'] || 'Civil Engineering').trim() as Department;
      const year = (row['Year'] || row['academicYear'] || row['academic_year'] || '3rd Year').trim() as AcademicYear;
      const japanese = (row['Japanese Student'] || row['japaneseStudent'] || 'No').trim() as 'Yes' | 'No';
      const aws = (row['AWS Interested'] || row['awsInterested'] || 'No').trim() as 'Yes' | 'No';
      const club = (row['Club'] || row['club'] || 'General').trim();
      const status = (row['Status'] || row['status'] || 'Active').trim();
      const confId = (row['Confirmation ID'] || row['confirmationId'] || `CONF-${Date.now().toString().slice(-6)}`).trim();
      const regDate = (row['Registration Date'] || row['registrationDate'] || new Date().toISOString().split('T')[0]).trim();

      if (!name || !regNo) {
        errors.push({ row: rowNum, error: `Missing required Name or Register Number` });
        return;
      }

      const normReg = regNo.toLowerCase();
      const normEmail = email ? email.toLowerCase() : `${normReg}@mkce.ac.in`;

      if (existingRegNos.has(normReg)) {
        duplicates.push(regNo);
        errors.push({ row: rowNum, error: `Duplicate Register Number: ${regNo}` });
        return;
      }

      if (existingEmails.has(normEmail)) {
        errors.push({ row: rowNum, error: `Duplicate Email: ${normEmail}` });
        return;
      }

      // Add to tracking
      existingRegNos.add(normReg);
      existingEmails.add(normEmail);

      const student: StudentProfile = {
        id: normReg,
        registerNumber: regNo.toUpperCase(),
        normalizedRegisterNumber: normReg,
        name: name.toUpperCase(),
        email: normEmail,
        normalizedEmail: normEmail,
        phone: phone || '+91 9800000000',
        department: dept,
        academicYear: year,
        club,
        japaneseStudent: japanese,
        awsInterested: aws,
        registrationStatus: status,
        confirmationId: confId,
        registrationDate: regDate,
        profileCompletionPercentage: 20,
        profileStatus: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isArchived: false
      };

      newStudents.push(student);
    });

    if (newStudents.length > 0) {
      const combined = [...existing, ...newStudents];
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(combined));
    }

    return {
      totalProcessed: rawRows.length,
      successCount: newStudents.length,
      failedCount: rawRows.length - newStudents.length,
      duplicates,
      errors
    };
  }

  // --- Announcements ---
  public async getAnnouncements(): Promise<Announcement[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      if (!data) return INITIAL_ANNOUNCEMENTS;
      return JSON.parse(data);
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  }

  public async saveAnnouncement(announcement: Announcement): Promise<Announcement> {
    const list = await this.getAnnouncements();
    const index = list.findIndex(a => a.id === announcement.id);
    if (index >= 0) {
      list[index] = announcement;
    } else {
      list.unshift(announcement);
    }
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
    return announcement;
  }

  public async deleteAnnouncement(id: string): Promise<boolean> {
    const list = await this.getAnnouncements();
    const updated = list.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(updated));
    return true;
  }

  // --- Officer Requests ---
  public async getRequests(): Promise<OfficerRequest[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      if (!data) return INITIAL_REQUESTS;
      return JSON.parse(data);
    } catch {
      return INITIAL_REQUESTS;
    }
  }

  public async createRequest(request: Omit<OfficerRequest, 'requestId' | 'submissionDate' | 'status'>): Promise<OfficerRequest> {
    const list = await this.getRequests();
    const newReq: OfficerRequest = {
      ...request,
      requestId: `REQ-2026-${(list.length + 101).toString().slice(-3)}`,
      submissionDate: new Date().toISOString(),
      status: 'Pending'
    };
    list.unshift(newReq);
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(list));
    return newReq;
  }

  public async updateRequestStatus(
    requestId: string, 
    status: RequestStatus, 
    reviewer: { uid: string; name: string; role: any }, 
    reviewComments?: string
  ): Promise<OfficerRequest | null> {
    const list = await this.getRequests();
    const req = list.find(r => r.requestId === requestId);
    if (!req) return null;

    req.status = status;
    req.reviewedBy = reviewer;
    if (reviewComments) req.reviewComments = reviewComments;
    req.resolvedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(list));
    return req;
  }

  // --- Audit Logs ---
  public async getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (!data) return INITIAL_AUDIT_LOGS;
      return JSON.parse(data);
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  }

  public async addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const logs = await this.getAuditLogs();
    const newLog: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    // Keep last 500 logs
    if (logs.length > 500) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    return newLog;
  }

  // --- Teams Formation ---
  public async getTeams(): Promise<TeamFormation[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEAMS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public async saveTeam(team: TeamFormation): Promise<TeamFormation> {
    const teams = await this.getTeams();
    const index = teams.findIndex(t => t.id === team.id);
    if (index >= 0) {
      teams[index] = team;
    } else {
      teams.unshift(team);
    }
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    return team;
  }

  public async deleteTeam(teamId: string): Promise<boolean> {
    const teams = await this.getTeams();
    const updated = teams.filter(t => t.id !== teamId);
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updated));
    return true;
  }

  // --- Dedicated User Avatar Registry (Persists logos/photos across logins & logouts) ---
  public getSavedAvatar(identifier?: string): string | null {
    if (!identifier) return null;
    try {
      const data = localStorage.getItem('civil_connect_user_avatars');
      if (!data) return null;
      const map = JSON.parse(data);
      const key = identifier.toLowerCase().trim();
      return map[key] || null;
    } catch {
      return null;
    }
  }

  public saveUserAvatar(identifier: string, avatarUrl: string): void {
    if (!identifier || !avatarUrl) return;
    try {
      const data = localStorage.getItem('civil_connect_user_avatars');
      const map = data ? JSON.parse(data) : {};
      const key = identifier.toLowerCase().trim();
      map[key] = avatarUrl;
      localStorage.setItem('civil_connect_user_avatars', JSON.stringify(map));
    } catch (err) {
      console.warn('Failed to save avatar', err);
    }
  }

  public removeUserAvatar(identifier: string): void {
    if (!identifier) return;
    try {
      const data = localStorage.getItem('civil_connect_user_avatars');
      if (!data) return;
      const map = JSON.parse(data);
      const key = identifier.toLowerCase().trim();
      delete map[key];
      localStorage.setItem('civil_connect_user_avatars', JSON.stringify(map));
    } catch (err) {
      console.warn('Failed to remove avatar', err);
    }
  }

  // --- Staff & Admin Management ---
  public async getStaffAccounts(): Promise<UserAccount[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STAFF_ACCOUNTS);
      let staff: UserAccount[] = data ? JSON.parse(data) : [...INITIAL_STAFF_ACCOUNTS];
      if (!Array.isArray(staff)) {
        staff = [...INITIAL_STAFF_ACCOUNTS];
      }

      let changed = false;

      // Always guarantee default staff members (like Harish Pranav Dev & Pranav Officer) are present
      INITIAL_STAFF_ACCOUNTS.forEach(initAcc => {
        const normEmail = initAcc.normalizedEmail.toLowerCase().trim();
        const existingIdx = staff.findIndex(
          s => s.normalizedEmail === normEmail || s.email.toLowerCase().trim() === normEmail
        );
        if (existingIdx === -1) {
          staff.push({ ...initAcc });
          changed = true;
        } else {
          // Fill in missing phone, dob if not present
          if (!staff[existingIdx].phone && initAcc.phone) {
            staff[existingIdx].phone = initAcc.phone;
            changed = true;
          }
          if (!staff[existingIdx].dob && initAcc.dob) {
            staff[existingIdx].dob = initAcc.dob;
            changed = true;
          }
        }
      });

      staff.forEach(s => {
        if (s.avatarUrl === '/harish_pranav_profile.jpg' || (s.avatarUrl && s.avatarUrl.includes('unsplash'))) {
          s.avatarUrl = this.getSavedAvatar(s.email) || this.getSavedAvatar(s.registerNumber) || undefined;
          changed = true;
        } else if (!s.avatarUrl) {
          const saved = this.getSavedAvatar(s.email) || this.getSavedAvatar(s.registerNumber);
          if (saved) {
            s.avatarUrl = saved;
            changed = true;
          }
        }
      });

      if (changed) {
        localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(staff));
      }
      return staff;
    } catch {
      return [...INITIAL_STAFF_ACCOUNTS];
    }
  }

  public async saveStaffAccount(account: UserAccount): Promise<UserAccount> {
    const staff = await this.getStaffAccounts();
    const index = staff.findIndex(s => s.uid === account.uid);
    if (index >= 0) {
      staff[index] = account;
    } else {
      staff.push(account);
    }
    localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(staff));

    if (account.avatarUrl) {
      this.saveUserAvatar(account.email, account.avatarUrl);
      if (account.registerNumber) this.saveUserAvatar(account.registerNumber, account.avatarUrl);
    }

    return account;
  }

  public async deleteStaffAccount(uid: string): Promise<boolean> {
    const staff = await this.getStaffAccounts();
    const updated = staff.filter(s => s.uid !== uid);
    localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(updated));
    return true;
  }

  // --- System Settings ---
  public async getSettings(): Promise<SystemSettings> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SYSTEM_SETTINGS;
      return { ...DEFAULT_SYSTEM_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SYSTEM_SETTINGS;
    }
  }

  public async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    const current = await this.getSettings();
    const merged = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
    return merged;
  }

  // --- Backup & Restore ---
  public async exportDatabaseJSON(): Promise<string> {
    const payload = {
      exportedAt: new Date().toISOString(),
      platform: 'CIVIL CONNECT',
      version: '1.0.0',
      students: await this.getStudents(true),
      announcements: await this.getAnnouncements(),
      requests: await this.getRequests(),
      staff: await this.getStaffAccounts(),
      teams: await this.getTeams(),
      auditLogs: await this.getAuditLogs(),
      settings: await this.getSettings()
    };
    return JSON.stringify(payload, null, 2);
  }

  public async restoreDatabaseJSON(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = JSON.parse(jsonString);
      if (!data.students || !Array.isArray(data.students)) {
        return { success: false, message: 'Invalid backup file structure: missing students array' };
      }

      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
      if (data.announcements) localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(data.announcements));
      if (data.requests) localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(data.requests));
      if (data.staff) localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(data.staff));
      if (data.teams) localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(data.teams));
      if (data.auditLogs) localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));

      return { success: true, message: `Successfully restored ${data.students.length} student records and system assets.` };
    } catch (err: any) {
      return { success: false, message: `Restore failed: ${err.message}` };
    }
  }

  // --- Support Tickets / Issue Reports ---
  public async getSupportTickets(): Promise<SupportTicket[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public async submitSupportTicket(ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>): Promise<SupportTicket> {
    const tickets = await this.getSupportTickets();
    const newTicket: SupportTicket = {
      ...ticketData,
      id: `ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      status: 'Open'
    };
    tickets.unshift(newTicket);
    localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(tickets));

    await this.addAuditLog({
      performedBy: ticketData.senderUid,
      performerName: ticketData.senderName,
      role: ticketData.senderRole,
      action: 'TICKET_SUBMITTED',
      affectedCollection: 'support_tickets',
      affectedRecordIds: [newTicket.id],
      operationStatus: 'success',
      details: `User reported issue: "${ticketData.subject}" (${ticketData.category})`
    });

    return newTicket;
  }

  public async replyToSupportTicket(
    ticketId: string, 
    reply: string, 
    adminName: string, 
    markResolved: boolean = true
  ): Promise<SupportTicket> {
    const tickets = await this.getSupportTickets();
    const index = tickets.findIndex(t => t.id === ticketId);
    if (index === -1) {
      throw new Error('Ticket not found');
    }

    const updated: SupportTicket = {
      ...tickets[index],
      adminReply: reply,
      repliedAt: new Date().toISOString(),
      repliedBy: adminName,
      status: markResolved ? 'Resolved' : 'In Progress'
    };
    tickets[index] = updated;
    localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(tickets));

    await this.addAuditLog({
      performedBy: 'admin',
      performerName: adminName,
      role: 'ADMIN',
      action: 'TICKET_REPLIED',
      affectedCollection: 'support_tickets',
      affectedRecordIds: [ticketId],
      operationStatus: 'success',
      details: `Admin replied to ticket "${updated.subject}": ${reply.slice(0, 50)}...`
    });

    return updated;
  }

  public async deleteSupportTicket(ticketId: string): Promise<boolean> {
    const tickets = await this.getSupportTickets();
    const updated = tickets.filter(t => t.id !== ticketId);
    localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(updated));
    return true;
  }

  // --- Account Requests (Officer & Student Sign-up Approvals) ---
  public async getPendingAccountRequests(): Promise<PendingAccountRequest[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNT_REQUESTS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public async savePendingAccountRequests(requests: PendingAccountRequest[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNT_REQUESTS, JSON.stringify(requests));
    } catch (err) {
      console.warn('Failed to save account requests', err);
    }
  }

  public async submitAccountRequest(
    req: Omit<PendingAccountRequest, 'id' | 'requestedAt' | 'status'>
  ): Promise<{ success: boolean; message: string; requestId?: string }> {
    const requests = await this.getPendingAccountRequests();
    
    // Check if email already requested or exists
    const cleanEmail = req.email.trim().toLowerCase();
    const existingReq = requests.find(r => r.email.trim().toLowerCase() === cleanEmail && r.status === 'pending');
    if (existingReq) {
      return { success: false, message: 'An account request for this email address is already pending approval by Department Admin.' };
    }

    const newRequest: PendingAccountRequest = {
      ...req,
      id: `accreq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: cleanEmail,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };

    requests.unshift(newRequest);
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_REQUESTS, JSON.stringify(requests));
    return { success: true, message: 'Request submitted successfully!', requestId: newRequest.id };
  }

  public async approveAccountRequest(
    requestId: string, 
    approver: UserAccount
  ): Promise<{ success: boolean; message: string }> {
    const requests = await this.getPendingAccountRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) {
      return { success: false, message: 'Request record not found.' };
    }

    const req = requests[index];
    const plainPass = req.passwordPlainText || 'civil';

    // Hash with standard system salt (matching authService)
    const encoder = new TextEncoder();
    const dataWithSalt = encoder.encode(plainPass + '_civil_connect_salt_2026');
    const hashBufferWithSalt = await crypto.subtle.digest('SHA-256', dataWithSalt);
    const passHash = Array.from(new Uint8Array(hashBufferWithSalt)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Legacy un-salted hash for backward compatibility
    const dataRaw = encoder.encode(plainPass);
    const hashBufferRaw = await crypto.subtle.digest('SHA-256', dataRaw);
    const passHashRaw = Array.from(new Uint8Array(hashBufferRaw)).map(b => b.toString(16).padStart(2, '0')).join('');

    // 1. Save into main auth credentials store ('civil_connect_account_credentials')
    const mainCredsData = localStorage.getItem('civil_connect_account_credentials');
    const mainCreds = mainCredsData ? JSON.parse(mainCredsData) : {};
    mainCreds[req.email.toLowerCase().trim()] = { identifier: req.email.toLowerCase().trim(), hash: passHash, isFirstLogin: false };
    if (req.registerNumber) {
      mainCreds[req.registerNumber.toLowerCase().trim()] = { identifier: req.registerNumber.toLowerCase().trim(), hash: passHash, isFirstLogin: false };
    }
    if (req.phone) {
      mainCreds[req.phone.toLowerCase().trim()] = { identifier: req.phone.toLowerCase().trim(), hash: passHash, isFirstLogin: false };
    }
    localStorage.setItem('civil_connect_account_credentials', JSON.stringify(mainCreds));

    // 2. Save into secondary legacy store ('civil_connect_passwords')
    const legacyCredsData = localStorage.getItem('civil_connect_passwords');
    const legacyCreds = legacyCredsData ? JSON.parse(legacyCredsData) : {};
    legacyCreds[req.email.toLowerCase().trim()] = { identifier: req.email.toLowerCase().trim(), hash: passHash, isFirstLogin: false };
    if (req.registerNumber) {
      legacyCreds[req.registerNumber.toLowerCase().trim()] = { identifier: req.registerNumber.toLowerCase().trim(), hash: passHash, isFirstLogin: false };
    }
    localStorage.setItem('civil_connect_passwords', JSON.stringify(legacyCreds));

    if (req.role === 'OFFICER') {
      const newOfficer: UserAccount = {
        uid: `officer-${Date.now()}`,
        registerNumber: req.phone || `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
        normalizedRegisterNumber: (req.phone || `fac-${Math.floor(1000 + Math.random() * 9000)}`).toLowerCase().trim(),
        email: req.email.trim(),
        normalizedEmail: req.email.toLowerCase().trim(),
        role: 'OFFICER',
        isFirstLogin: false,
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        name: req.name.trim(),
        department: req.department,
        academicYear: '2nd Year',
        avatarUrl: undefined
      };

      await this.saveStaffAccount(newOfficer);
    } else {
      // Student
      const regClean = (req.registerNumber || `TEMP${Date.now()}`).trim();
      const newStudent: StudentProfile = {
        id: regClean.toLowerCase(),
        registerNumber: regClean,
        normalizedRegisterNumber: regClean.toLowerCase(),
        name: req.name.trim(),
        email: req.email.trim(),
        normalizedEmail: req.email.toLowerCase().trim(),
        phone: req.phone.trim(),
        department: req.department,
        academicYear: req.academicYear || '1st Year',
        club: 'Civil Engineers Association (CEA)',
        japaneseStudent: 'No',
        awsInterested: 'No',
        registrationStatus: 'Active',
        confirmationId: `STU-${Date.now()}`,
        registrationDate: new Date().toISOString(),
        profileCompletionPercentage: 0,
        profileStatus: 'verified',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      await this.saveStudent(newStudent);
    }

    req.status = 'approved';
    req.approvedBy = `${approver.name} (${approver.role})`;
    req.approvedAt = new Date().toISOString();
    requests[index] = req;
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_REQUESTS, JSON.stringify(requests));

    await this.addAuditLog({
      performedBy: approver.uid,
      performerName: approver.name,
      role: approver.role,
      action: 'ACCOUNT_REQUEST_APPROVED',
      affectedCollection: req.role === 'OFFICER' ? 'staff' : 'students',
      affectedRecordIds: [requestId, req.email],
      operationStatus: 'success',
      details: `Approved new ${req.role} account request for ${req.name} (${req.email}). Account is now active.`
    });

    return { success: true, message: `Account request for ${req.name} approved! They can now log in immediately.` };
  }

  public async rejectAccountRequest(
    requestId: string, 
    reason: string = 'Verification declined by department authority.'
  ): Promise<{ success: boolean; message: string }> {
    const requests = await this.getPendingAccountRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) {
      return { success: false, message: 'Request not found.' };
    }
    requests[index].status = 'rejected';
    requests[index].rejectionReason = reason;
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_REQUESTS, JSON.stringify(requests));
    return { success: true, message: 'Account request declined.' };
  }
}

export const storageService = new StorageService();
