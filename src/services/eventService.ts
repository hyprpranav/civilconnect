import { 
  EventItem, 
  EventRegistration, 
  EventAttendanceRecord, 
  EventWillingness, 
  AttendanceStatus, 
  StudentProfile 
} from '../types';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { getFirestoreDb } from './firebaseConfig';
import * as XLSX from 'xlsx';

const STORAGE_KEYS = {
  EVENTS: 'civil_connect_events',
  REGISTRATIONS: 'civil_connect_event_registrations',
  ATTENDANCE: 'civil_connect_event_attendance'
};

export const DEFAULT_SUSTAINOVA_EVENT: EventItem = {
  id: 'sustainova-2026',
  name: 'SUSTAINOVA',
  slug: 'sustainova',
  description: 'Sustainable Innovation for Infrastructure and Industry - An institutional workshop focusing on green technologies, sustainable construction materials, circular economy in infrastructure, and carbon-neutral civil engineering designs.',
  date: '11 November 2026',
  startTime: '09:00 AM',
  endTime: '04:00 PM',
  venue: 'Ramanujan Hall, MKCE',
  resourcePerson: 'Dr. G. Balaji',
  resourcePersonDesignation: 'Assistant Professor & HoD',
  resourcePersonDepartment: 'Civil Engineering, MKCE',
  registrationStatus: 'open',
  organizer: 'ICI Sustainable Engineers Club',
  club: 'AAROH Student Club, MKCE',
  createdAt: '2026-11-04T00:00:00.000Z',
  updatedAt: '2026-11-04T00:00:00.000Z'
};

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

class EventService {
  constructor() {
    this.initDefaults();
  }

  private initDefaults() {
    try {
      const localEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (!localEvents) {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([DEFAULT_SUSTAINOVA_EVENT]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)) {
        localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
      }
    } catch (e) {
      console.warn('[EventService] localStorage init fallback', e);
    }
  }

  // ==========================================
  // EVENTS MANAGEMENT
  // ==========================================

  public async getEvents(): Promise<EventItem[]> {
    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'events'));
        if (!snap.empty) {
          const events: EventItem[] = [];
          snap.forEach(d => events.push(d.data() as EventItem));
          // Ensure SUSTAINOVA is present
          const hasSustainova = events.some(e => e.id === 'sustainova-2026' || e.slug === 'sustainova');
          if (!hasSustainova) {
            events.unshift(DEFAULT_SUSTAINOVA_EVENT);
            await setDoc(doc(db, 'events', DEFAULT_SUSTAINOVA_EVENT.id), sanitizeForFirestore(DEFAULT_SUSTAINOVA_EVENT));
          }
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
          return events;
        } else {
          // Seed initial default event
          await setDoc(doc(db, 'events', DEFAULT_SUSTAINOVA_EVENT.id), sanitizeForFirestore(DEFAULT_SUSTAINOVA_EVENT));
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([DEFAULT_SUSTAINOVA_EVENT]));
          return [DEFAULT_SUSTAINOVA_EVENT];
        }
      } catch (err) {
        console.warn('[EventService] Firestore getEvents fallback to local:', err);
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [DEFAULT_SUSTAINOVA_EVENT];
  }

  public async getEventById(id: string): Promise<EventItem | null> {
    const norm = id.toLowerCase().trim();
    if (norm === 'sustainova' || norm === 'sustainova-2026') {
      const all = await this.getEvents();
      return all.find(e => e.id === 'sustainova-2026' || e.slug === 'sustainova') || DEFAULT_SUSTAINOVA_EVENT;
    }

    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'events', id));
        if (snap.exists()) return snap.data() as EventItem;
      } catch (err) {
        console.warn('[EventService] Direct event lookup fallback:', err);
      }
    }

    const events = await this.getEvents();
    return events.find(e => e.id === id || e.slug === id) || null;
  }

  public async saveEvent(event: EventItem): Promise<EventItem> {
    const events = await this.getEvents();
    const existingIndex = events.findIndex(e => e.id === event.id);
    const updated: EventItem = {
      ...event,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      events[existingIndex] = updated;
    } else {
      events.push(updated);
    }

    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

    const db = getFirestoreDb();
    if (!db) {
      throw new Error('Cloud database connection is not available. Please verify your internet connection.');
    }

    try {
      await setDoc(doc(db, 'events', updated.id), sanitizeForFirestore(updated));
    } catch (err: any) {
      console.error('[EventService] Firebase Firestore saveEvent error:', err);
      throw new Error(`Failed to save event in cloud database: ${err?.message || 'Database error'}`);
    }

    return updated;
  }

  public async deleteEvent(id: string): Promise<void> {
    if (id === 'sustainova-2026') {
      throw new Error('Default SUSTAINOVA event cannot be deleted.');
    }
    const events = (await this.getEvents()).filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

    const db = getFirestoreDb();
    if (db) {
      try {
        await deleteDoc(doc(db, 'events', id));
      } catch (err) {
        console.error('[EventService] Firestore deleteEvent error:', err);
      }
    }
  }

  public subscribeToEvents(callback: (events: EventItem[]) => void): () => void {
    const db = getFirestoreDb();
    if (!db) {
      this.getEvents().then(callback);
      return () => {};
    }

    try {
      return onSnapshot(collection(db, 'events'), (snap) => {
        if (!snap.empty) {
          const events: EventItem[] = [];
          snap.forEach(d => events.push(d.data() as EventItem));
          const hasSustainova = events.some(e => e.id === 'sustainova-2026' || e.slug === 'sustainova');
          if (!hasSustainova) events.unshift(DEFAULT_SUSTAINOVA_EVENT);
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
          callback(events);
        } else {
          callback([DEFAULT_SUSTAINOVA_EVENT]);
        }
      }, (err) => {
        console.warn('[EventService] subscribeToEvents error:', err);
        this.getEvents().then(callback);
      });
    } catch {
      this.getEvents().then(callback);
      return () => {};
    }
  }

  // ==========================================
  // REGISTRATIONS MANAGEMENT
  // ==========================================

  public async getRegistrations(eventId?: string): Promise<EventRegistration[]> {
    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'event_registrations'));
        const list: EventRegistration[] = [];
        snap.forEach(d => list.push(d.data() as EventRegistration));
        localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(list));
        if (eventId) {
          return list.filter(r => r.eventId === eventId);
        }
        return list;
      } catch (err) {
        console.warn('[EventService] Firestore getRegistrations fallback to local:', err);
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
      if (stored) {
        const parsed = JSON.parse(stored) as EventRegistration[];
        if (eventId) return parsed.filter(r => r.eventId === eventId);
        return parsed;
      }
    } catch {}
    return [];
  }

  public async getRegistrationForStudent(eventId: string, studentId: string): Promise<EventRegistration | null> {
    const normStudent = studentId.toLowerCase().trim();
    const docId = `${eventId}_${normStudent}`;

    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'event_registrations', docId));
        if (snap.exists()) {
          return snap.data() as EventRegistration;
        }
      } catch (err) {
        console.warn('[EventService] getRegistrationForStudent doc check:', err);
      }
    }

    const regs = await this.getRegistrations(eventId);
    return regs.find(r => 
      r.eventId === eventId && 
      (r.studentId.toLowerCase() === normStudent || 
       r.studentRegisterNumber.toLowerCase() === normStudent)
    ) || null;
  }

  public async registerStudent(params: {
    eventId: string;
    student: StudentProfile;
    willingness: EventWillingness;
    notes?: string;
  }): Promise<{
    success: boolean;
    alreadyRegistered?: boolean;
    registration?: EventRegistration;
    error?: string;
  }> {
    const { eventId, student, willingness, notes } = params;
    const normStudent = (student.normalizedRegisterNumber || student.id || student.registerNumber).toLowerCase().trim();
    const docId = `${eventId}_${normStudent}`;

    // 1. Strict duplicate registration check
    const existing = await this.getRegistrationForStudent(eventId, normStudent);
    if (existing) {
      return {
        success: false,
        alreadyRegistered: true,
        registration: existing,
        error: 'YOU HAVE ALREADY REGISTERED FOR THIS EVENT.'
      };
    }

    const newRegistration: EventRegistration = {
      id: docId,
      eventId,
      studentId: normStudent,
      studentRegisterNumber: student.registerNumber,
      studentName: student.name,
      studentDepartment: student.department || 'Civil Engineering',
      studentYear: student.academicYear,
      studentClub: student.club,
      willingness,
      registeredAt: new Date().toISOString(),
      notes
    };

    // 2. Persist directly to Firebase Firestore Cloud Database
    const db = getFirestoreDb();
    if (!db) {
      throw new Error('Cloud database connection is not available. Please verify your internet connection.');
    }

    try {
      await setDoc(doc(db, 'event_registrations', docId), sanitizeForFirestore(newRegistration));
    } catch (err: any) {
      console.error('[EventService] Firebase Firestore registration save failed:', err);
      throw new Error(`Failed to save registration in cloud database: ${err?.message || 'Database error'}`);
    }

    // 3. Update local cache for instant UI feedback
    try {
      const allRegs = await this.getRegistrations();
      const existingIdx = allRegs.findIndex(r => r.id === docId);
      if (existingIdx >= 0) {
        allRegs[existingIdx] = newRegistration;
      } else {
        allRegs.push(newRegistration);
      }
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(allRegs));
    } catch (e) {
      console.warn('[EventService] Cache write note:', e);
    }

    return {
      success: true,
      alreadyRegistered: false,
      registration: newRegistration
    };
  }

  public subscribeToRegistrations(eventId: string, callback: (registrations: EventRegistration[]) => void): () => void {
    const db = getFirestoreDb();
    if (!db) {
      this.getRegistrations(eventId).then(callback);
      return () => {};
    }

    try {
      return onSnapshot(collection(db, 'event_registrations'), (snap) => {
        const list: EventRegistration[] = [];
        snap.forEach(d => {
          const item = d.data() as EventRegistration;
          if (item.eventId === eventId) list.push(item);
        });
        localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(list));
        callback(list);
      }, (err) => {
        console.warn('[EventService] subscribeToRegistrations error:', err);
        this.getRegistrations(eventId).then(callback);
      });
    } catch {
      this.getRegistrations(eventId).then(callback);
      return () => {};
    }
  }

  // ==========================================
  // ATTENDANCE MANAGEMENT
  // ==========================================

  public async getAttendance(eventId: string): Promise<EventAttendanceRecord[]> {
    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'event_attendance'));
        const list: EventAttendanceRecord[] = [];
        snap.forEach(d => {
          const rec = d.data() as EventAttendanceRecord;
          if (rec.eventId === eventId) list.push(rec);
        });
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
        return list;
      } catch (err) {
        console.warn('[EventService] Firestore getAttendance fallback:', err);
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (stored) {
        const parsed = JSON.parse(stored) as EventAttendanceRecord[];
        return parsed.filter(a => a.eventId === eventId);
      }
    } catch {}
    return [];
  }

  public async markAttendance(params: {
    eventId: string;
    student: {
      id: string;
      registerNumber: string;
      name: string;
      department: string;
      academicYear?: string;
    };
    status: AttendanceStatus;
    markedBy: {
      uid: string;
      name: string;
      role: string;
    };
    notes?: string;
  }): Promise<EventAttendanceRecord> {
    const { eventId, student, status, markedBy, notes } = params;
    const normStudent = (student.id || student.registerNumber).toLowerCase().trim();
    const docId = `${eventId}_${normStudent}`;

    const record: EventAttendanceRecord = {
      id: docId,
      eventId,
      studentId: normStudent,
      studentRegisterNumber: student.registerNumber,
      studentName: student.name,
      studentDepartment: student.department,
      studentYear: student.academicYear,
      status,
      markedByUid: markedBy.uid,
      markedByName: markedBy.name,
      markedByRole: markedBy.role,
      markedAt: new Date().toISOString(),
      notes
    };

    // 1. Save directly to Firebase Firestore
    const db = getFirestoreDb();
    if (!db) {
      throw new Error('Cloud database connection is not available. Please verify your internet connection.');
    }

    try {
      await setDoc(doc(db, 'event_attendance', docId), sanitizeForFirestore(record));
    } catch (err: any) {
      console.error('[EventService] Firebase Firestore attendance update failed:', err);
      throw new Error(`Failed to update attendance in cloud database: ${err?.message || 'Database error'}`);
    }

    // 2. Cache locally for instant UI update
    try {
      const allAttendance = await this.getAttendance(eventId);
      const index = allAttendance.findIndex(a => a.id === docId);
      if (index >= 0) {
        allAttendance[index] = record;
      } else {
        allAttendance.push(record);
      }
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(allAttendance));
    } catch (e) {
      console.warn('[EventService] Cache attendance note:', e);
    }

    return record;
  }

  public subscribeToAttendance(eventId: string, callback: (records: EventAttendanceRecord[]) => void): () => void {
    const db = getFirestoreDb();
    if (!db) {
      this.getAttendance(eventId).then(callback);
      return () => {};
    }

    try {
      return onSnapshot(collection(db, 'event_attendance'), (snap) => {
        const list: EventAttendanceRecord[] = [];
        snap.forEach(d => {
          const item = d.data() as EventAttendanceRecord;
          if (item.eventId === eventId) list.push(item);
        });
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
        callback(list);
      }, (err) => {
        console.warn('[EventService] subscribeToAttendance error:', err);
        this.getAttendance(eventId).then(callback);
      });
    } catch {
      this.getAttendance(eventId).then(callback);
      return () => {};
    }
  }

  // ==========================================
  // STUDENT SEARCH LOGIC FOR REGISTRATION
  // ==========================================

  public searchStudentsForRegistration(query: string, allStudents: StudentProfile[]): StudentProfile[] {
    const raw = (query || '').trim();
    if (!raw) return [];

    const lower = raw.toLowerCase();
    const digits = raw.replace(/\D/g, '');

    return allStudents.filter(s => {
      // 1. Register number exact or substring
      const reg = (s.registerNumber || '').toLowerCase().trim();
      const normReg = (s.normalizedRegisterNumber || s.id || '').toLowerCase().trim();
      if (reg === lower || normReg === lower) return true;
      if (reg.includes(lower) || normReg.includes(lower)) return true;

      // 2. Student Name substring
      const name = (s.name || '').toLowerCase().trim();
      if (name.includes(lower)) return true;

      // 3. Mobile Number digits check
      if (digits.length >= 5 && s.phone) {
        const studentPhoneDigits = s.phone.replace(/\D/g, '');
        if (studentPhoneDigits.includes(digits)) return true;
        if (digits.length >= 10 && studentPhoneDigits.length >= 10) {
          if (studentPhoneDigits.slice(-10) === digits.slice(-10)) return true;
        }
      }

      return false;
    });
  }

  // ==========================================
  // EVENT EXPORT REPORTS GENERATOR (CSV & XLSX)
  // ==========================================

  public exportRegistrationReport(
    event: EventItem,
    allStudents: StudentProfile[],
    registrations: EventRegistration[],
    format: 'csv' | 'xlsx'
  ) {
    const regMap = new Map<string, EventRegistration>();
    registrations.forEach(r => {
      regMap.set(r.studentId.toLowerCase().trim(), r);
      regMap.set(r.studentRegisterNumber.toLowerCase().trim(), r);
    });

    const rows = allStudents.map((s, idx) => {
      const reg = regMap.get(s.id.toLowerCase().trim()) || regMap.get(s.registerNumber.toLowerCase().trim());
      const willingness = reg ? (reg.willingness === 'WILLING' ? 'Willing' : 'Not Willing') : 'Pending';
      const regTime = reg ? new Date(reg.registeredAt).toLocaleString('en-IN') : 'N/A';

      return {
        'S.No': idx + 1,
        'Register Number': s.registerNumber,
        'Student Name': s.name,
        'Department': s.department,
        'Academic Year': s.academicYear,
        'Club': s.club || 'Sustainable Engineers',
        'Response Status': willingness,
        'Registration Timestamp': regTime,
        'Event ID': event.id,
        'Event Name': event.name
      };
    });

    const filename = `${event.slug || event.name.toLowerCase()}_registrations_${new Date().toISOString().split('T')[0]}.${format}`;
    this.downloadDataset(rows, filename, format, 'Registrations');
  }

  public exportAttendanceReport(
    event: EventItem,
    attendanceRecords: EventAttendanceRecord[],
    willingRegistrations: EventRegistration[],
    format: 'csv' | 'xlsx'
  ) {
    const attMap = new Map<string, EventAttendanceRecord>();
    attendanceRecords.forEach(a => {
      attMap.set(a.studentId.toLowerCase().trim(), a);
      attMap.set(a.studentRegisterNumber.toLowerCase().trim(), a);
    });

    const rows = willingRegistrations.map((w, idx) => {
      const att = attMap.get(w.studentId.toLowerCase().trim()) || attMap.get(w.studentRegisterNumber.toLowerCase().trim());
      const status = att ? att.status : 'ABSENT';
      const markedBy = att ? `${att.markedByName} (${att.markedByRole})` : 'System Default';
      const markedAt = att?.markedAt ? new Date(att.markedAt).toLocaleString('en-IN') : 'N/A';

      return {
        'S.No': idx + 1,
        'Register Number': w.studentRegisterNumber,
        'Student Name': w.studentName,
        'Department': w.studentDepartment,
        'Academic Year': w.studentYear || 'N/A',
        'Attendance Status': status,
        'Marked By': markedBy,
        'Marked Timestamp': markedAt,
        'Event ID': event.id,
        'Event Name': event.name
      };
    });

    const totalWilling = willingRegistrations.length;
    const totalPresent = rows.filter(r => r['Attendance Status'] === 'PRESENT').length;
    const totalAbsent = totalWilling - totalPresent;
    const percentage = totalWilling > 0 ? ((totalPresent / totalWilling) * 100).toFixed(1) + '%' : '0%';

    // Add summary row at bottom
    rows.push({
      'S.No': '' as any,
      'Register Number': 'SUMMARY METRICS',
      'Student Name': `Total Willing: ${totalWilling}`,
      'Department': `Present: ${totalPresent}`,
      'Academic Year': `Absent: ${totalAbsent}`,
      'Attendance Status': `Turnout: ${percentage}` as any,
      'Marked By': `Event Date: ${event.date}`,
      'Marked Timestamp': `Venue: ${event.venue}`,
      'Event ID': event.id,
      'Event Name': event.name
    });

    const filename = `${event.slug || event.name.toLowerCase()}_attendance_${new Date().toISOString().split('T')[0]}.${format}`;
    this.downloadDataset(rows, filename, format, 'Attendance');
  }

  public exportCompleteEventReport(
    event: EventItem,
    allStudents: StudentProfile[],
    registrations: EventRegistration[],
    attendance: EventAttendanceRecord[],
    format: 'csv' | 'xlsx'
  ) {
    const regMap = new Map<string, EventRegistration>();
    registrations.forEach(r => {
      regMap.set(r.studentId.toLowerCase().trim(), r);
      regMap.set(r.studentRegisterNumber.toLowerCase().trim(), r);
    });

    const attMap = new Map<string, EventAttendanceRecord>();
    attendance.forEach(a => {
      attMap.set(a.studentId.toLowerCase().trim(), a);
      attMap.set(a.studentRegisterNumber.toLowerCase().trim(), a);
    });

    const rows = allStudents.map((s, idx) => {
      const reg = regMap.get(s.id.toLowerCase().trim()) || regMap.get(s.registerNumber.toLowerCase().trim());
      const att = attMap.get(s.id.toLowerCase().trim()) || attMap.get(s.registerNumber.toLowerCase().trim());

      const willingness = reg ? (reg.willingness === 'WILLING' ? 'Willing' : 'Not Willing') : 'Pending';
      const regTimestamp = reg ? new Date(reg.registeredAt).toLocaleString('en-IN') : 'N/A';
      const attStatus = att ? att.status : (willingness === 'Willing' ? 'ABSENT' : 'Not Applicable');
      const attMarkedBy = att ? `${att.markedByName} (${att.markedByRole})` : 'N/A';
      const attTime = att?.markedAt ? new Date(att.markedAt).toLocaleString('en-IN') : 'N/A';

      return {
        'S.No': idx + 1,
        'Register Number': s.registerNumber,
        'Student Name': s.name,
        'Department': s.department,
        'Academic Year': s.academicYear,
        'Registration Response': willingness,
        'Registration Time': regTimestamp,
        'Attendance Status': attStatus,
        'Attendance Evaluator': attMarkedBy,
        'Attendance Time': attTime,
        'Event Name': event.name,
        'Event Date': event.date,
        'Venue': event.venue,
        'Resource Person': `${event.resourcePerson} (${event.resourcePersonDesignation}, ${event.resourcePersonDepartment})`
      };
    });

    const filename = `${event.slug || event.name.toLowerCase()}_master_report_${new Date().toISOString().split('T')[0]}.${format}`;
    this.downloadDataset(rows, filename, format, 'Master Event Report');
  }

  private downloadDataset(data: any[], filename: string, format: 'csv' | 'xlsx', sheetName: string) {
    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, filename);
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      const csvContent = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}

export const eventService = new EventService();

