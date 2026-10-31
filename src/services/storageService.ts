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
  PendingAccountRequest,
  TeamProposalRequest 
} from '../types';
import { INITIAL_STUDENTS } from '../data/initialStudents';
import { 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_REQUESTS, 
  INITIAL_STAFF_ACCOUNTS, 
  INITIAL_AUDIT_LOGS, 
  DEFAULT_SYSTEM_SETTINGS 
} from '../data/initialData';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  onSnapshot 
} from 'firebase/firestore';
import { getFirestoreDb } from './firebaseConfig';

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
  TEAM_REQUESTS: 'civil_connect_team_requests',
  INITIALIZED: 'civil_connect_initialized_clean_v6'
};

// Firestore helper: strips all `undefined` values recursively to avoid FirebaseError
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return null as any;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object') {
    const clean: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean;
  }
  return data;
}

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
      if (!initialized) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
        localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(INITIAL_STAFF_ACCOUNTS));
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
        localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SYSTEM_SETTINGS));
        localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'civil_connect_initialized_clean_v6');
      }
    } catch (e) {
      console.error('Storage initialization failed', e);
    }
  }

  // --- Students Management ---
  public async getStudents(includeArchived = false): Promise<StudentProfile[]> {
    let students: StudentProfile[] = [];
    const db = getFirestoreDb();

    // 1. Try fetching from Cloud Firestore
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'students'));
        if (!snap.empty) {
          students = snap.docs.map(d => d.data() as StudentProfile);
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
        } else {
          // Cloud Firestore is fresh/empty: Batch-seed all initial students to cloud
          students = INITIAL_STUDENTS;
          try {
            const batch = writeBatch(db);
            students.forEach(s => {
              const sRef = doc(db, 'students', s.id);
              batch.set(sRef, sanitizeForFirestore(s));
            });
            await batch.commit();
            console.log('[Firestore] Successfully seeded 97 initial students to Cloud Firestore.');
          } catch (seedErr) {
            console.warn('[Firestore] Failed seeding students to cloud:', seedErr);
          }
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
        }
      } catch (cloudErr) {
        console.warn('[Firestore] Students fetch failed, falling back to local cache:', cloudErr);
      }
    }

    // 2. Fallback to local storage cache if offline or cloud read failed
    if (students.length === 0) {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
        if (data) {
          students = JSON.parse(data);
        }
      } catch {
        // ignore
      }
      if (!Array.isArray(students) || students.length === 0) {
        students = INITIAL_STUDENTS;
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      }
    }

    // 3. Synchronize persistent user avatars and purge legacy placeholder paths
    let changed = false;
    students.forEach(s => {
      // Clean up accidental assignment of Harish Pranav's avatar to LACHUNASRI P
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

    if (includeArchived) return students;
    return students.filter(s => !s.isArchived);
  }

  public async getArchivedStudents(): Promise<StudentProfile[]> {
    const students = await this.getStudents(true);
    return students.filter(s => s.isArchived);
  }

  public async getStudentById(identifier: string): Promise<StudentProfile | null> {
    const students = await this.getStudents(true);
    const key = identifier.toLowerCase().trim();
    if (!key) return null;

    const inputDigits = key.replace(/\D/g, '');

    const found = students.find(s => {
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
    });

    if (found) return found;

    // Direct Firestore doc lookup fallback for newly created students or cold starts
    const db = getFirestoreDb();
    if (db) {
      try {
        const docRef = doc(db, 'students', key);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return snap.data() as StudentProfile;
        }
      } catch (err) {
        console.warn('[Firestore] Direct student lookup note:', err);
      }
    }

    return null;
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

    // Save to local cache
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    // Save avatar
    if (updatedStudent.profileImage) {
      this.saveUserAvatar(updatedStudent.email, updatedStudent.profileImage);
      this.saveUserAvatar(updatedStudent.registerNumber, updatedStudent.profileImage);
    } else {
      this.removeUserAvatar(updatedStudent.email);
      this.removeUserAvatar(updatedStudent.registerNumber);
    }

    // Sync to Cloud Firestore
    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'students', normKey), sanitizeForFirestore(updatedStudent), { merge: true });
      } catch (err) {
        console.warn('[Firestore] Failed saving student to cloud:', err);
      }
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

    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'students', normReg), sanitizeForFirestore(newStudent));
      } catch (err) {
        console.warn('[Firestore] Failed adding student to cloud:', err);
      }
    }

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

    const db = getFirestoreDb();
    if (db) {
      try {
        if (softDelete) {
          await setDoc(doc(db, 'students', key), { isArchived: true, archivedAt: new Date().toISOString() }, { merge: true });
        } else {
          await deleteDoc(doc(db, 'students', key));
        }
      } catch (err) {
        console.warn('[Firestore] Failed deleting student from cloud:', err);
      }
    }

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

    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'students', key), { isArchived: false, archivedAt: null }, { merge: true });
      } catch (err) {
        console.warn('[Firestore] Failed restoring student in cloud:', err);
      }
    }

    return true;
  }

  /**
   * Reset filled questionnaire answers, skills, and interview evaluations for a student.
   * Keeps core collegiate registration data (Name, RegNo, Email, Phone, Dept, Year, Club) intact.
   */
  public async resetStudentFilledData(
    studentIdentifier: string,
    performer: { uid: string; name: string; role: any; email?: string }
  ): Promise<{ success: boolean; message: string; updatedStudent?: StudentProfile }> {
    const student = await this.getStudentById(studentIdentifier);
    if (!student) {
      return { success: false, message: 'Student record not found.' };
    }

    const normKey = student.normalizedRegisterNumber || student.registerNumber.toLowerCase().trim();

    // Reset filled profile fields and interview evaluation, but KEEP basic registration
    const resetStudent: StudentProfile = {
      ...student,
      id: normKey,
      normalizedRegisterNumber: normKey,
      profileCompletionPercentage: 0,
      profileStatus: 'draft',
      shortBio: '',
      personalInterests: [],
      skills: undefined,
      interests: undefined,
      teamStrengths: undefined,
      teamPreferences: undefined,
      interviewEvaluation: undefined,
      submittedAt: undefined,
      updatedAt: new Date().toISOString()
    };

    // Save locally
    const students = await this.getStudents(true);
    const idx = students.findIndex(s => s.id === normKey || s.normalizedRegisterNumber === normKey);
    if (idx >= 0) {
      students[idx] = resetStudent;
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    }

    // Save to Firestore
    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'students', normKey), sanitizeForFirestore(resetStudent));
      } catch (err) {
        console.warn('[Firestore] Reset student cloud save note:', err);
      }
    }

    // Write audit log
    await this.addAuditLog({
      performedBy: performer.uid,
      performerName: performer.name,
      role: performer.role,
      action: `Student Profile & Evaluation Data Reset: ${student.name} (${student.registerNumber})`,
      affectedCollection: 'students',
      affectedRecordIds: [normKey],
      operationStatus: 'success',
      details: `Filled student submission and interview evaluation removed by ${performer.name} (${performer.role}). Student returned to 0% draft status.`
    });

    return {
      success: true,
      message: `Successfully reset filled data and interview evaluation for ${student.name}.`,
      updatedStudent: resetStudent
    };
  }

  public async bulkDeleteStudents(normalizedRegNos: string[], softDelete = true): Promise<{ count: number }> {
    const students = await this.getStudents(true);
    const set = new Set(normalizedRegNos.map(s => s.toLowerCase().trim()));
    let count = 0;

    const db = getFirestoreDb();
    const batch = db ? writeBatch(db) : null;

    if (softDelete) {
      students.forEach(s => {
        if (set.has(s.id)) {
          s.isArchived = true;
          s.archivedAt = new Date().toISOString();
          count++;
          if (batch && db) {
            batch.set(doc(db, 'students', s.id), { isArchived: true, archivedAt: s.archivedAt }, { merge: true });
          }
        }
      });
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } else {
      const remaining = students.filter(s => {
        if (set.has(s.id)) {
          count++;
          if (batch && db) {
            batch.delete(doc(db, 'students', s.id));
          }
          return false;
        }
        return true;
      });
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(remaining));
    }

    if (batch) {
      try {
        await batch.commit();
      } catch (err) {
        console.warn('[Firestore] Failed bulk delete in cloud:', err);
      }
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

      const db = getFirestoreDb();
      if (db) {
        try {
          for (let i = 0; i < newStudents.length; i += 400) {
            const chunk = newStudents.slice(i, i + 400);
            const batch = writeBatch(db);
            chunk.forEach(s => {
              batch.set(doc(db, 'students', s.id), sanitizeForFirestore(s), { merge: true });
            });
            await batch.commit();
          }
        } catch (err) {
          console.warn('[Firestore] Failed importing students to cloud:', err);
        }
      }
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
    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'announcements'));
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as Announcement);
          localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn('[Firestore] Announcements fetch failed:', err);
      }
    }
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

    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'announcements', announcement.id), sanitizeForFirestore(announcement));
      } catch (err) {
        console.warn('[Firestore] Failed saving announcement:', err);
      }
    }

    return announcement;
  }

  public async deleteAnnouncement(id: string): Promise<boolean> {
    const list = await this.getAnnouncements();
    const updated = list.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(updated));

    const db = getFirestoreDb();
    if (db) {
      try {
        await deleteDoc(doc(db, 'announcements', id));
      } catch (err) {
        console.warn('[Firestore] Failed deleting announcement:', err);
      }
    }

    return true;
  }

  // --- Officer Requests ---
  public async getRequests(): Promise<OfficerRequest[]> {
    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'requests'));
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as OfficerRequest);
          localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn('[Firestore] Requests fetch failed:', err);
      }
    }
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

    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'requests', newReq.requestId), sanitizeForFirestore(newReq));
      } catch (err) {
        console.warn('[Firestore] Failed saving request:', err);
      }
    }

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

    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'requests', requestId), sanitizeForFirestore(req), { merge: true });
      } catch (err) {
        console.warn('[Firestore] Failed updating request status:', err);
      }
    }

    return req;
  }

  // --- Audit Logs ---
  public async getAuditLogs(): Promise<AuditLogEntry[]> {
    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'auditLogs'));
        if (!snap.empty) {
          const logs = snap.docs.map(d => d.data() as AuditLogEntry);
          logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
          return logs;
        } else {
          try {
            const batch = writeBatch(db);
            INITIAL_AUDIT_LOGS.forEach(l => {
              batch.set(doc(db, 'auditLogs', l.id), sanitizeForFirestore(l));
            });
            await batch.commit();
          } catch {}
          return INITIAL_AUDIT_LOGS;
        }
      } catch (err) {
        console.warn('[Firestore] Audit logs fetch failed:', err);
      }
    }
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
    if (logs.length > 500) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));

    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'auditLogs', newLog.id), sanitizeForFirestore(newLog));
      } catch (err) {
        console.warn('[Firestore] Failed adding audit log:', err);
      }
    }

    return newLog;
  }

  // --- Teams Formation ---
  public async getTeams(): Promise<TeamFormation[]> {
    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'teams'));
        if (!snap.empty) {
          const teams = snap.docs.map(d => d.data() as TeamFormation);
          localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
          return teams;
        }
      } catch (err) {
        console.warn('[Firestore] Teams fetch failed:', err);
      }
    }
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

    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'teams', team.id), sanitizeForFirestore(team), { merge: true });
      } catch (err) {
        console.warn('[Firestore] Failed saving team:', err);
      }
    }

    return team;
  }

  public async deleteTeam(teamId: string): Promise<boolean> {
    const teams = await this.getTeams();
    const updated = teams.filter(t => t.id !== teamId);
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updated));

    const db = getFirestoreDb();
    if (db) {
      try {
        await deleteDoc(doc(db, 'teams', teamId));
      } catch (err) {
        console.warn('[Firestore] Failed deleting team:', err);
      }
    }

    return true;
  }

  // --- Student Team Formation Proposals & Requests ---
  public async getTeamRequests(): Promise<TeamProposalRequest[]> {
    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'team_requests'));
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as TeamProposalRequest);
          list.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
          localStorage.setItem(STORAGE_KEYS.TEAM_REQUESTS, JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn('[Firestore] Team requests fetch failed:', err);
      }
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEAM_REQUESTS);
      if (!data) return [];
      const parsed: TeamProposalRequest[] = JSON.parse(data);
      parsed.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
      return parsed;
    } catch {
      return [];
    }
  }

  public async createTeamRequest(
    request: Omit<TeamProposalRequest, 'id' | 'submissionDate' | 'status'>
  ): Promise<TeamProposalRequest> {
    const id = `treq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newReq: TeamProposalRequest = {
      ...request,
      id,
      submissionDate: now,
      status: 'Pending'
    };

    const list = await this.getTeamRequests();
    list.unshift(newReq);
    localStorage.setItem(STORAGE_KEYS.TEAM_REQUESTS, JSON.stringify(list));

    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'team_requests', id), sanitizeForFirestore(newReq));
      } catch (err) {
        console.warn('[Firestore] Failed saving team proposal request:', err);
      }
    }

    await this.addAuditLog({
      performedBy: request.submittedByStudentId,
      performerName: request.submittedByStudentName,
      role: 'STUDENT',
      action: `Team Proposal Submitted: "${request.teamName}" (${request.members.length} members)`,
      affectedCollection: 'team_requests',
      affectedRecordIds: [id],
      operationStatus: 'success',
      details: `Project Domain: ${request.projectDomain} | Target: ${request.targetCompetition}`
    });

    return newReq;
  }

  public async approveTeamRequest(
    requestId: string,
    reviewer: { uid: string; name: string; role: any }
  ): Promise<TeamFormation | null> {
    const requests = await this.getTeamRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return null;

    // Generate official team code (e.g. TM001, TM002)
    const allTeams = await this.getTeams();
    let nextNum = 1;
    allTeams.forEach(t => {
      const match = (t.teamCode || t.teamNumber || '').match(/\d+/);
      if (match) {
        const n = parseInt(match[0], 10);
        if (n >= nextNum) nextNum = n + 1;
      }
    });
    const teamCode = `TM${String(nextNum).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const createdTeam: TeamFormation = {
      id: `team_${Date.now()}`,
      teamCode,
      teamNumber: teamCode,
      teamName: req.teamName,
      targetSize: req.targetSize,
      projectDomain: req.projectDomain,
      members: req.members,
      targetCompetition: req.targetCompetition,
      createdBy: `Student Proposal: ${req.submittedByStudentName}`,
      creatorUid: req.submittedByStudentId,
      creatorRole: 'STUDENT',
      createdAt: now,
      status: 'Confirmed',
      notes: req.notes
    };

    await this.saveTeam(createdTeam);

    // Update the request document
    req.status = 'Approved';
    req.reviewedBy = reviewer.name;
    req.reviewedAt = now;
    req.resultingTeamId = createdTeam.id;
    req.resultingTeamCode = teamCode;

    localStorage.setItem(STORAGE_KEYS.TEAM_REQUESTS, JSON.stringify(requests));
    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'team_requests', requestId), sanitizeForFirestore(req), { merge: true });
      } catch (err) {
        console.warn('[Firestore] Failed updating approved team request:', err);
      }
    }

    await this.addAuditLog({
      performedBy: reviewer.uid,
      performerName: reviewer.name,
      role: reviewer.role,
      action: `Approved Student Team Proposal: "${req.teamName}" -> ${teamCode}`,
      affectedCollection: 'teams',
      affectedRecordIds: [createdTeam.id, requestId],
      operationStatus: 'success',
      details: `Formed official squad with ${req.members.length} student members.`
    });

    return createdTeam;
  }

  public async rejectTeamRequest(
    requestId: string,
    reviewer: { uid: string; name: string; role: any },
    reason?: string
  ): Promise<boolean> {
    const requests = await this.getTeamRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return false;

    const now = new Date().toISOString();
    req.status = 'Rejected';
    req.reviewedBy = reviewer.name;
    req.reviewedAt = now;
    req.rejectionReason = reason || 'Proposal not approved by faculty committee at this time.';

    localStorage.setItem(STORAGE_KEYS.TEAM_REQUESTS, JSON.stringify(requests));
    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'team_requests', requestId), sanitizeForFirestore(req), { merge: true });
      } catch (err) {
        console.warn('[Firestore] Failed updating rejected team request:', err);
      }
    }

    await this.addAuditLog({
      performedBy: reviewer.uid,
      performerName: reviewer.name,
      role: reviewer.role,
      action: `Rejected Student Team Proposal: "${req.teamName}"`,
      affectedCollection: 'team_requests',
      affectedRecordIds: [requestId],
      operationStatus: 'warning',
      details: `Reason: ${req.rejectionReason}`
    });

    return true;
  }

  public subscribeToTeamRequests(callback: (requests: TeamProposalRequest[]) => void): () => void {
    const db = getFirestoreDb();
    if (!db) {
      this.getTeamRequests().then(callback);
      return () => {};
    }
    try {
      const unsub = onSnapshot(collection(db, 'team_requests'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as TeamProposalRequest);
          list.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
          localStorage.setItem(STORAGE_KEYS.TEAM_REQUESTS, JSON.stringify(list));
          callback(list);
        }
      }, (err) => {
        console.warn('[Firestore] Team requests listener failed:', err);
        this.getTeamRequests().then(callback);
      });
      return unsub;
    } catch {
      this.getTeamRequests().then(callback);
      return () => {};
    }
  }

  // --- Dedicated User Avatar Registry (Persists logos/photos across logins, logouts, devices) ---
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

      // Persist to Cloud Firestore collection 'avatars'
      const db = getFirestoreDb();
      if (db) {
        setDoc(doc(db, 'avatars', key), {
          identifier: key,
          avatarUrl,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(err => {
          console.warn('[Firestore] Failed saving avatar to cloud:', err);
        });
      }
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

      const db = getFirestoreDb();
      if (db) {
        deleteDoc(doc(db, 'avatars', key)).catch(() => {});
      }
    } catch (err) {
      console.warn('Failed to remove avatar', err);
    }
  }

  public async syncAvatarsFromCloud(): Promise<void> {
    const db = getFirestoreDb();
    if (!db) return;
    try {
      const snap = await getDocs(collection(db, 'avatars'));
      if (!snap.empty) {
        const data = localStorage.getItem('civil_connect_user_avatars');
        const map = data ? JSON.parse(data) : {};
        snap.docs.forEach(d => {
          const rec = d.data();
          if (rec.identifier && rec.avatarUrl) {
            map[rec.identifier.toLowerCase().trim()] = rec.avatarUrl;
          }
        });
        localStorage.setItem('civil_connect_user_avatars', JSON.stringify(map));
      }
    } catch (err) {
      console.warn('[Firestore] Avatar sync note:', err);
    }
  }

  // --- Staff & Admin Management ---
  public async getStaffAccounts(): Promise<UserAccount[]> {
    let staff: UserAccount[] = [];
    const db = getFirestoreDb();

    if (db) {
      try {
        const snap = await getDocs(collection(db, 'staff_accounts'));
        if (!snap.empty) {
          staff = snap.docs.map(d => d.data() as UserAccount);
          localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(staff));
        } else {
          // Cloud collection empty: seed INITIAL_STAFF_ACCOUNTS to cloud
          staff = [...INITIAL_STAFF_ACCOUNTS];
          try {
            const batch = writeBatch(db);
            INITIAL_STAFF_ACCOUNTS.forEach(acc => {
              batch.set(doc(db, 'staff_accounts', acc.uid), sanitizeForFirestore(acc));
            });
            await batch.commit();
          } catch (seedErr) {
            console.warn('[Firestore] Failed seeding staff to cloud:', seedErr);
          }
          localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(staff));
        }
      } catch (err) {
        console.warn('[Firestore] Staff accounts fetch failed:', err);
      }
    }

    if (staff.length === 0) {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.STAFF_ACCOUNTS);
        staff = data ? JSON.parse(data) : [...INITIAL_STAFF_ACCOUNTS];
      } catch {
        staff = [...INITIAL_STAFF_ACCOUNTS];
      }
    }

    let changed = false;

    // Always guarantee default staff members (Harish Pranav Dev & Pranav Officer) are present
    INITIAL_STAFF_ACCOUNTS.forEach(initAcc => {
      const normEmail = initAcc.normalizedEmail.toLowerCase().trim();
      const existingIdx = staff.findIndex(
        s => s.normalizedEmail === normEmail || s.email.toLowerCase().trim() === normEmail
      );
      if (existingIdx === -1) {
        staff.push({ ...initAcc });
        changed = true;
      } else {
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

    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'staff_accounts', account.uid), sanitizeForFirestore(account), { merge: true });
      } catch (err) {
        console.warn('[Firestore] Failed saving staff account to cloud:', err);
      }
    }

    return account;
  }

  public async deleteStaffAccount(uid: string): Promise<boolean> {
    const staff = await this.getStaffAccounts();
    const updated = staff.filter(s => s.uid !== uid);
    localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(updated));

    const db = getFirestoreDb();
    if (db) {
      try {
        await deleteDoc(doc(db, 'staff_accounts', uid));
      } catch (err) {
        console.warn('[Firestore] Failed deleting staff account:', err);
      }
    }

    return true;
  }

  // --- System Settings ---
  public async getSettings(): Promise<SystemSettings> {
    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'systemSettings', 'config'));
        if (snap.exists()) {
          const cloudSettings = { ...DEFAULT_SYSTEM_SETTINGS, ...snap.data() } as SystemSettings;
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cloudSettings));
          return cloudSettings;
        }
      } catch (err) {
        console.warn('[Firestore] Settings fetch failed:', err);
      }
    }
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

    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'systemSettings', 'config'), sanitizeForFirestore(merged), { merge: true });
      } catch (err) {
        console.warn('[Firestore] Failed updating system settings:', err);
      }
    }

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

      // Push restored students and staff to cloud
      const db = getFirestoreDb();
      if (db) {
        try {
          for (let i = 0; i < data.students.length; i += 400) {
            const chunk = data.students.slice(i, i + 400);
            const batch = writeBatch(db);
            chunk.forEach((s: StudentProfile) => {
              batch.set(doc(db, 'students', s.id), sanitizeForFirestore(s), { merge: true });
            });
            await batch.commit();
          }
        } catch (cloudErr) {
          console.warn('[Firestore] Failed pushing restored students to cloud:', cloudErr);
        }
      }

      return { success: true, message: `Successfully restored ${data.students.length} student records and system assets.` };
    } catch (err: any) {
      return { success: false, message: `Restore failed: ${err.message}` };
    }
  }

  // --- Support Tickets / Issue Reports ---
  public async getSupportTickets(): Promise<SupportTicket[]> {
    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'support_tickets'));
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as SupportTicket);
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn('[Firestore] Support tickets fetch failed:', err);
      }
    }
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

    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'support_tickets', newTicket.id), sanitizeForFirestore(newTicket));
      } catch (err) {
        console.warn('[Firestore] Failed saving support ticket to cloud:', err);
      }
    }

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

    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'support_tickets', ticketId), sanitizeForFirestore(updated), { merge: true });
      } catch (err) {
        console.warn('[Firestore] Failed updating support ticket in cloud:', err);
      }
    }

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

    const db = getFirestoreDb();
    if (db) {
      try {
        await deleteDoc(doc(db, 'support_tickets', ticketId));
      } catch (err) {
        console.warn('[Firestore] Failed deleting support ticket from cloud:', err);
      }
    }

    return true;
  }

  // --- Account Requests (Officer & Student Sign-up Approvals) ---
  public async getPendingAccountRequests(): Promise<PendingAccountRequest[]> {
    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'account_requests'));
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as PendingAccountRequest);
          localStorage.setItem(STORAGE_KEYS.ACCOUNT_REQUESTS, JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn('[Firestore] Account requests fetch failed:', err);
      }
    }
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

    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'account_requests', newRequest.id), sanitizeForFirestore(newRequest));
      } catch (err) {
        console.warn('[Firestore] Failed saving account request to cloud:', err);
      }
    }

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

    // Save into main auth credentials store ('civil_connect_account_credentials')
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

    // Also persist to Cloud Firestore credentials collection
    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'credentials', req.email.toLowerCase().trim()), {
          identifier: req.email.toLowerCase().trim(),
          hash: passHash,
          isFirstLogin: false,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        if (req.registerNumber) {
          await setDoc(doc(db, 'credentials', req.registerNumber.toLowerCase().trim()), {
            identifier: req.registerNumber.toLowerCase().trim(),
            hash: passHash,
            isFirstLogin: false,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (err) {
        console.warn('[Firestore] Failed saving approved credentials to cloud:', err);
      }
    }

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

    if (db) {
      try {
        await setDoc(doc(db, 'account_requests', requestId), sanitizeForFirestore(req), { merge: true });
      } catch (err) {
        console.warn('[Firestore] Failed updating account request status in cloud:', err);
      }
    }

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

    const db = getFirestoreDb();
    if (db) {
      try {
        await setDoc(doc(db, 'account_requests', requestId), sanitizeForFirestore(requests[index]), { merge: true });
      } catch (err) {
        console.warn('[Firestore] Failed updating rejected request in cloud:', err);
      }
    }

    return { success: true, message: 'Account request declined.' };
  }

  // =========================================================================
  // REAL-TIME FIRESTORE SUBSCRIPTIONS (onSnapshot)
  // Ensures instant cross-browser & multi-device sync without manual refreshes
  // =========================================================================

  public subscribeToStudents(
    callback: (students: StudentProfile[]) => void, 
    includeArchived = false
  ): () => void {
    const db = getFirestoreDb();
    if (!db) {
      this.getStudents(includeArchived).then(callback);
      return () => {};
    }

    const unsub = onSnapshot(collection(db, 'students'), (snap) => {
      if (!snap.empty) {
        const liveStudents = snap.docs.map(d => d.data() as StudentProfile);
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(liveStudents));
        const filtered = includeArchived ? liveStudents : liveStudents.filter(s => !s.isArchived);
        callback(filtered);
      }
    }, (error) => {
      console.warn('[Firestore] Students onSnapshot note:', error);
      this.getStudents(includeArchived).then(callback);
    });

    return unsub;
  }

  public subscribeToStudent(
    studentId: string, 
    callback: (student: StudentProfile | null) => void
  ): () => void {
    const db = getFirestoreDb();
    const cleanId = studentId.toLowerCase().trim();
    if (!db || !cleanId) {
      this.getStudentById(cleanId).then(callback);
      return () => {};
    }

    const unsub = onSnapshot(doc(db, 'students', cleanId), (snap) => {
      if (snap.exists()) {
        const liveStudent = snap.data() as StudentProfile;
        callback(liveStudent);
      } else {
        callback(null);
      }
    }, (error) => {
      console.warn('[Firestore] Single student onSnapshot note:', error);
      this.getStudentById(cleanId).then(callback);
    });

    return unsub;
  }

  public subscribeToTeams(callback: (teams: TeamFormation[]) => void): () => void {
    const db = getFirestoreDb();
    if (!db) {
      this.getTeams().then(callback);
      return () => {};
    }

    const unsub = onSnapshot(collection(db, 'teams'), (snap) => {
      const liveTeams = snap.docs.map(d => d.data() as TeamFormation);
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(liveTeams));
      callback(liveTeams);
    }, (error) => {
      console.warn('[Firestore] Teams onSnapshot note:', error);
      this.getTeams().then(callback);
    });

    return unsub;
  }

  public subscribeToAuditLogs(callback: (logs: AuditLogEntry[]) => void): () => void {
    const db = getFirestoreDb();
    if (!db) {
      this.getAuditLogs().then(callback);
      return () => {};
    }

    const unsub = onSnapshot(collection(db, 'auditLogs'), (snap) => {
      if (!snap.empty) {
        const liveLogs = snap.docs.map(d => d.data() as AuditLogEntry);
        liveLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(liveLogs));
        callback(liveLogs);
      }
    }, (error) => {
      console.warn('[Firestore] AuditLogs onSnapshot note:', error);
      this.getAuditLogs().then(callback);
    });

    return unsub;
  }

  public subscribeToAnnouncements(callback: (announcements: Announcement[]) => void): () => void {
    const db = getFirestoreDb();
    if (!db) {
      this.getAnnouncements().then(callback);
      return () => {};
    }

    const unsub = onSnapshot(collection(db, 'announcements'), (snap) => {
      const live = snap.docs.map(d => d.data() as Announcement);
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(live));
      callback(live);
    }, (error) => {
      console.warn('[Firestore] Announcements onSnapshot note:', error);
      this.getAnnouncements().then(callback);
    });

    return unsub;
  }
}

export const storageService = new StorageService();
