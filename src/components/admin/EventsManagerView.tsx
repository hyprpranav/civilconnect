import React, { useState, useEffect } from 'react';
import { 
  EventItem, 
  EventRegistration, 
  EventAttendanceRecord, 
  StudentProfile, 
  UserAccount, 
  EventRegistrationStatus,
  AttendanceStatus
} from '../../types';
import { eventService, DEFAULT_SUSTAINOVA_EVENT } from '../../services/eventService';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  UserCheck, 
  UserX, 
  HelpCircle, 
  Download, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  X,
  Award,
  ChevronDown,
  UserPlus
} from 'lucide-react';

interface EventsManagerViewProps {
  currentUser: UserAccount;
  students: StudentProfile[];
  onRefreshData?: () => void;
}

export const EventsManagerView: React.FC<EventsManagerViewProps> = ({
  currentUser,
  students,
  onRefreshData
}) => {
  const [events, setEvents] = useState<EventItem[]>([DEFAULT_SUSTAINOVA_EVENT]);
  const [selectedEventId, setSelectedEventId] = useState<string>('sustainova-2026');
  const [activeSubTab, setActiveSubTab] = useState<'registrations' | 'attendance' | 'exports' | 'details'>('registrations');
  
  // Registration sub-tab: 'willing' | 'notWilling' | 'pending'
  const [regFilter, setRegFilter] = useState<'willing' | 'notWilling' | 'pending'>('willing');

  // Real-time collections for selected event
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<EventAttendanceRecord[]>([]);

  // Search filter inside tables
  const [searchTable, setSearchTable] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Modals
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [addStudentSearch, setAddStudentSearch] = useState('');
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<StudentProfile | null>(null);
  const [addStudentAttendanceStatus, setAddStudentAttendanceStatus] = useState<AttendanceStatus>('PRESENT');

  // Notifications
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load and subscribe to events
  useEffect(() => {
    const unsubEvents = eventService.subscribeToEvents((loadedEvents) => {
      setEvents(loadedEvents);
      if (!loadedEvents.some(e => e.id === selectedEventId)) {
        if (loadedEvents.length > 0) setSelectedEventId(loadedEvents[0].id);
      }
    });

    return () => unsubEvents();
  }, [selectedEventId]);

  // Subscribe to registrations & attendance for active selected event
  useEffect(() => {
    if (!selectedEventId) return;

    const unsubRegs = eventService.subscribeToRegistrations(selectedEventId, (regs) => {
      setRegistrations(regs);
    });

    const unsubAtt = eventService.subscribeToAttendance(selectedEventId, (att) => {
      setAttendanceRecords(att);
    });

    return () => {
      unsubRegs();
      unsubAtt();
    };
  }, [selectedEventId]);

  const activeEvent = events.find(e => e.id === selectedEventId) || events[0] || DEFAULT_SUSTAINOVA_EVENT;

  // Dynamic grouping of students
  const regMap = new Map<string, EventRegistration>();
  registrations.forEach(r => {
    regMap.set(r.studentId.toLowerCase().trim(), r);
    regMap.set(r.studentRegisterNumber.toLowerCase().trim(), r);
  });

  const willingList: { student: StudentProfile; reg: EventRegistration }[] = [];
  const notWillingList: { student: StudentProfile; reg: EventRegistration }[] = [];
  const pendingList: StudentProfile[] = [];

  students.forEach(s => {
    const r = regMap.get(s.id.toLowerCase().trim()) || regMap.get(s.registerNumber.toLowerCase().trim());
    if (r) {
      if (r.willingness === 'WILLING') {
        willingList.push({ student: s, reg: r });
      } else {
        notWillingList.push({ student: s, reg: r });
      }
    } else {
      pendingList.push(s);
    }
  });

  // Attendance Map
  const attMap = new Map<string, EventAttendanceRecord>();
  attendanceRecords.forEach(a => {
    attMap.set(a.studentId.toLowerCase().trim(), a);
    attMap.set(a.studentRegisterNumber.toLowerCase().trim(), a);
  });

  // Total metrics
  const totalRoster = students.length;
  const totalWilling = willingList.length;
  const totalNotWilling = notWillingList.length;
  const totalPending = pendingList.length;

  // Present/Absent among willing students (plus any students explicitly marked in attendance)
  const presentCount = attendanceRecords.filter(a => a.status === 'PRESENT').length;
  const absentCount = Math.max(0, totalWilling - presentCount);
  const turnoutPercentage = totalWilling > 0 ? ((presentCount / totalWilling) * 100).toFixed(1) : '0.0';

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Handle Event Create / Edit Save
  const handleSaveEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const eventName = (formData.get('name') as string)?.trim();
    if (!eventName) {
      showNotification('Event Name is required', 'error');
      return;
    }

    const payload: EventItem = {
      id: editingEvent ? editingEvent.id : `event-${Date.now()}`,
      name: eventName,
      slug: (formData.get('slug') as string)?.trim() || eventName.toLowerCase().replace(/\s+/g, '-'),
      description: (formData.get('description') as string)?.trim() || '',
      date: (formData.get('date') as string)?.trim() || '',
      startTime: (formData.get('startTime') as string)?.trim() || '',
      endTime: (formData.get('endTime') as string)?.trim() || '',
      venue: (formData.get('venue') as string)?.trim() || '',
      resourcePerson: (formData.get('resourcePerson') as string)?.trim() || '',
      resourcePersonDesignation: (formData.get('resourcePersonDesignation') as string)?.trim() || '',
      resourcePersonDepartment: (formData.get('resourcePersonDepartment') as string)?.trim() || '',
      registrationStatus: (formData.get('registrationStatus') as EventRegistrationStatus) || 'open',
      organizer: (formData.get('organizer') as string)?.trim() || 'ICI Sustainable Engineers Club',
      club: (formData.get('club') as string)?.trim() || 'AAROH Student Club, MKCE',
      createdAt: editingEvent ? editingEvent.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await eventService.saveEvent(payload);
      showNotification(editingEvent ? 'Event updated successfully.' : 'New event created successfully.');
      setIsEventModalOpen(false);
      setEditingEvent(null);
      setSelectedEventId(payload.id);
    } catch (err: any) {
      showNotification(err?.message || 'Error saving event', 'error');
    }
  };

  // Toggle Attendance
  const handleToggleAttendance = async (student: StudentProfile, newStatus: AttendanceStatus) => {
    try {
      await eventService.markAttendance({
        eventId: activeEvent.id,
        student: {
          id: student.id,
          registerNumber: student.registerNumber,
          name: student.name,
          department: student.department,
          academicYear: student.academicYear
        },
        status: newStatus,
        markedBy: {
          uid: currentUser.uid,
          name: currentUser.name,
          role: currentUser.role
        }
      });
      showNotification(`Attendance marked: ${student.name} (${newStatus})`);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update attendance', 'error');
    }
  };

  // Add Student to Attendance
  const handleAddStudentToAttendance = async () => {
    if (!selectedStudentToAdd) return;
    try {
      await eventService.markAttendance({
        eventId: activeEvent.id,
        student: {
          id: selectedStudentToAdd.id,
          registerNumber: selectedStudentToAdd.registerNumber,
          name: selectedStudentToAdd.name,
          department: selectedStudentToAdd.department,
          academicYear: selectedStudentToAdd.academicYear
        },
        status: addStudentAttendanceStatus,
        markedBy: {
          uid: currentUser.uid,
          name: currentUser.name,
          role: currentUser.role
        },
        notes: 'Added via Faculty Add Student'
      });
      showNotification(`Added ${selectedStudentToAdd.name} to attendance roster as ${addStudentAttendanceStatus}`);
      setIsAddStudentModalOpen(false);
      setSelectedStudentToAdd(null);
      setAddStudentSearch('');
    } catch (err: any) {
      showNotification(err?.message || 'Failed to add student to attendance', 'error');
    }
  };

  // Search filter for students
  const filterStudentList = <T extends { student: StudentProfile } | StudentProfile>(list: T[]): T[] => {
    const query = searchTable.toLowerCase().trim();
    return list.filter(item => {
      const s = 'student' in item ? (item as any).student as StudentProfile : item as StudentProfile;
      if (deptFilter !== 'All' && s.department !== deptFilter) return false;
      if (!query) return true;
      const reg = (s.registerNumber || '').toLowerCase();
      const name = (s.name || '').toLowerCase();
      const dept = (s.department || '').toLowerCase();
      return reg.includes(query) || name.includes(query) || dept.includes(query);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Event Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Selector */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <Calendar className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Events Management Console
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Manage event parameters, real-time student willingness, roll call attendance, and institutional analytics.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Event Switcher */}
            <div className="relative min-w-[200px]">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none cursor-pointer"
              >
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({ev.date})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Edit Active Event */}
            <button
              onClick={() => {
                setEditingEvent(activeEvent);
                setIsEventModalOpen(true);
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Event</span>
            </button>

            {/* Create New Event */}
            <button
              onClick={() => {
                setEditingEvent(null);
                setIsEventModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </button>

            {/* Direct Landing Page Link */}
            {activeEvent.slug === 'sustainova' && (
              <a
                href="/sustainova"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5"
              >
                <span>View Public Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Selected Event Details Card */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Schedule & Venue</span>
            <span className="font-bold text-slate-900 block mt-0.5">{activeEvent.date}</span>
            <span className="text-slate-500 text-[11px] block">{activeEvent.startTime} – {activeEvent.endTime}</span>
            <span className="text-emerald-700 font-semibold text-[11px] block mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {activeEvent.venue}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Resource Person</span>
            <span className="font-bold text-slate-900 block mt-0.5">{activeEvent.resourcePerson}</span>
            <span className="text-slate-500 text-[11px] block">{activeEvent.resourcePersonDesignation}</span>
            <span className="text-slate-600 text-[11px] block mt-0.5 truncate">{activeEvent.resourcePersonDepartment}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Host Organization</span>
            <span className="font-bold text-slate-900 block mt-0.5">{activeEvent.organizer || 'ICI Sustainable Engineers'}</span>
            <span className="text-slate-500 text-[11px] block">{activeEvent.club || 'AAROH Student Club'}</span>
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md uppercase bg-emerald-100 text-emerald-800">
              {activeEvent.registrationStatus}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 flex flex-col justify-between">
            <div>
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Roster Breakdown</span>
              <div className="flex items-center gap-3 mt-1 font-bold text-xs">
                <span className="text-emerald-700">Willing: {totalWilling}</span>
                <span className="text-rose-600">No: {totalNotWilling}</span>
                <span className="text-amber-600">Pending: {totalPending}</span>
              </div>
            </div>
            <div className="pt-1 text-[11px] text-slate-500">
              Total Database: <span className="font-bold text-slate-800">{totalRoster} Students</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('registrations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'registrations'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registrations</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeSubTab === 'registrations' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {totalWilling}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'attendance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Attendance</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeSubTab === 'attendance' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {presentCount} / {totalWilling}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('exports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'exports'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Event Exports</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: REGISTRATIONS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'registrations' && (
        <div className="space-y-4">
          
          {/* Top 3 Metric Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setRegFilter('willing')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                regFilter === 'willing'
                  ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Willing Students
                </span>
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-950 mt-1">{totalWilling}</div>
              <div className="text-[11px] text-emerald-700 mt-0.5">Confirmed participation</div>
            </button>

            <button
              onClick={() => setRegFilter('notWilling')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                regFilter === 'notWilling'
                  ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                  Not Willing
                </span>
                <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-rose-950 mt-1">{totalNotWilling}</div>
              <div className="text-[11px] text-rose-700 mt-0.5">Explicitly opted out</div>
            </button>

            <button
              onClick={() => setRegFilter('pending')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                regFilter === 'pending'
                  ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Pending Students
                </span>
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-amber-950 mt-1">{totalPending}</div>
              <div className="text-[11px] text-amber-700 mt-0.5">Yet to respond</div>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                placeholder="Search by name, reg no..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-semibold shrink-0">Department:</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="All">All Departments</option>
                {Array.from(new Set(students.map(s => s.department))).filter(Boolean).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">S.No</th>
                    <th className="px-4 py-3">Register No</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Academic Year</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {/* WILLING STUDENTS TAB */}
                  {regFilter === 'willing' && (() => {
                    const filtered = filterStudentList(willingList);
                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                            No willing students found matching criteria.
                          </td>
                        </tr>
                      );
                    }
                    return filtered.map((item, idx) => (
                      <tr key={item.student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{item.student.registerNumber}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{item.student.name}</td>
                        <td className="px-4 py-2.5">{item.student.department}</td>
                        <td className="px-4 py-2.5">{item.student.academicYear || 'N/A'}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Willing
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                          {new Date(item.reg.registeredAt).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ));
                  })()}

                  {/* NOT WILLING STUDENTS TAB */}
                  {regFilter === 'notWilling' && (() => {
                    const filtered = filterStudentList(notWillingList);
                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                            No not-willing records found.
                          </td>
                        </tr>
                      );
                    }
                    return filtered.map((item, idx) => (
                      <tr key={item.student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{item.student.registerNumber}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{item.student.name}</td>
                        <td className="px-4 py-2.5">{item.student.department}</td>
                        <td className="px-4 py-2.5">{item.student.academicYear || 'N/A'}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3" /> Not Willing
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                          {new Date(item.reg.registeredAt).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ));
                  })()}

                  {/* PENDING STUDENTS TAB */}
                  {regFilter === 'pending' && (() => {
                    const filtered = filterStudentList(pendingList);
                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                            All students have responded! No pending students.
                          </td>
                        </tr>
                      );
                    }
                    return filtered.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{student.registerNumber}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{student.name}</td>
                        <td className="px-4 py-2.5">{student.department}</td>
                        <td className="px-4 py-2.5">{student.academicYear || 'N/A'}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <HelpCircle className="w-3 h-3" /> Pending
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px]">
                          Not submitted yet
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: ATTENDANCE MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-4">
          
          {/* Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Willing</span>
              <div className="text-xl font-black text-slate-900 mt-0.5">{totalWilling}</div>
              <span className="text-[10px] text-slate-500">Target roll call list</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Present</span>
              <div className="text-xl font-black text-emerald-800 mt-0.5">{presentCount}</div>
              <span className="text-[10px] text-emerald-600 font-medium">Attended session</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Total Absent</span>
              <div className="text-xl font-black text-rose-800 mt-0.5">{absentCount}</div>
              <span className="text-[10px] text-rose-600 font-medium">Missing</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Turnout Percentage</span>
              <div className="text-xl font-black text-blue-900 mt-0.5">{turnoutPercentage}%</div>
              <span className="text-[10px] text-blue-600 font-medium">Attendance rate</span>
            </div>
          </div>

          {/* Action Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                placeholder="Filter attendance list..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setAddStudentSearch('');
                  setSelectedStudentToAdd(null);
                  setIsAddStudentModalOpen(true);
                }}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>ADD STUDENT</span>
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">S.No</th>
                    <th className="px-4 py-3">Register No</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Attendance Status</th>
                    <th className="px-4 py-3">Marked By</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(() => {
                    // Display willing students + any added students in attendanceRecords
                    const targetStudents: StudentProfile[] = willingList.map(w => w.student);
                    
                    // Also include any students in attendanceRecords who were not originally in willingList
                    attendanceRecords.forEach(att => {
                      const exists = targetStudents.some(s => 
                        s.id.toLowerCase() === att.studentId.toLowerCase() || 
                        s.registerNumber.toLowerCase() === att.studentRegisterNumber.toLowerCase()
                      );
                      if (!exists) {
                        const matchedInRoster = students.find(s => 
                          s.id.toLowerCase() === att.studentId.toLowerCase() || 
                          s.registerNumber.toLowerCase() === att.studentRegisterNumber.toLowerCase()
                        );
                        if (matchedInRoster) {
                          targetStudents.push(matchedInRoster);
                        } else {
                          targetStudents.push({
                            id: att.studentId,
                            registerNumber: att.studentRegisterNumber,
                            normalizedRegisterNumber: att.studentId,
                            name: att.studentName,
                            email: '',
                            normalizedEmail: '',
                            phone: '',
                            department: att.studentDepartment,
                            academicYear: (att.studentYear as any) || '1st Year',
                            club: 'Sustainable Engineers',
                            japaneseStudent: 'No',
                            awsInterested: 'No',
                            registrationStatus: 'ACCEPTED',
                            confirmationId: '',
                            registrationDate: '',
                            profileCompletionPercentage: 0,
                            profileStatus: 'draft',
                            createdAt: att.markedAt,
                            updatedAt: att.markedAt
                          });
                        }
                      }
                    });

                    const filtered = filterStudentList(targetStudents);
                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-slate-400 italic">
                            No students in attendance roster. Click "ADD STUDENT" to manually add attendees.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((s, idx) => {
                      const att = attMap.get(s.id.toLowerCase().trim()) || attMap.get(s.registerNumber.toLowerCase().trim());
                      const isPresent = att ? att.status === 'PRESENT' : false;

                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{s.registerNumber}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-900">{s.name}</td>
                          <td className="px-4 py-2.5">{s.department}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isPresent 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {isPresent ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {isPresent ? 'PRESENT' : 'ABSENT'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 text-[11px]">
                            {att ? `${att.markedByName} (${att.markedByRole})` : 'Default'}
                          </td>
                          <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px]">
                            {att ? new Date(att.markedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleToggleAttendance(s, 'PRESENT')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  isPresent
                                    ? 'bg-emerald-700 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleToggleAttendance(s, 'ABSENT')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  !isPresent && att
                                    ? 'bg-rose-700 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: EVENT EXPORTS MODULE */}
      {/* ========================================================================= */}
      {activeSubTab === 'exports' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Institutional Event Reporting & Data Exports
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate and download comprehensive event reports in pure CSV and Microsoft Excel (.xlsx) formats from live database records.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              
              {/* Report 1: Registration Report */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                      <Users className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">1. Registration Report</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Includes all Willing, Not-Willing, and Pending students with their department details, year, and registration timestamps.
                  </p>
                  <div className="mt-3 text-[10px] text-slate-400 font-semibold">
                    {totalWilling} Willing • {totalNotWilling} Not Willing • {totalPending} Pending
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => eventService.exportRegistrationReport(activeEvent, students, registrations, 'xlsx')}
                    className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => eventService.exportRegistrationReport(activeEvent, students, registrations, 'csv')}
                    className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    CSV
                  </button>
                </div>
              </div>

              {/* Report 2: Attendance Report */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                      <UserCheck className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">2. Attendance Report</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Includes verified attendees, Present/Absent status, evaluator audit signature, time of attendance, and overall percentage turnout.
                  </p>
                  <div className="mt-3 text-[10px] text-slate-400 font-semibold">
                    {presentCount} Present • {absentCount} Absent • {turnoutPercentage}% Turnout
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => {
                      const willingRegs = registrations.filter(r => r.willingness === 'WILLING');
                      eventService.exportAttendanceReport(activeEvent, attendanceRecords, willingRegs, 'xlsx');
                    }}
                    className="flex-1 py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => {
                      const willingRegs = registrations.filter(r => r.willingness === 'WILLING');
                      eventService.exportAttendanceReport(activeEvent, attendanceRecords, willingRegs, 'csv');
                    }}
                    className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    CSV
                  </button>
                </div>
              </div>

              {/* Report 3: Complete Event Master Report */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">3. Complete Event Report</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Comprehensive multi-column master file merging event metadata, full roster willingness, attendance records, and faculty remarks.
                  </p>
                  <div className="mt-3 text-[10px] text-slate-400 font-semibold">
                    Event: {activeEvent.name} • {totalRoster} Records
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => eventService.exportCompleteEventReport(activeEvent, students, registrations, attendanceRecords, 'xlsx')}
                    className="flex-1 py-2 px-3 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => eventService.exportCompleteEventReport(activeEvent, students, registrations, attendanceRecords, 'csv')}
                    className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    CSV
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT EVENT */}
      {/* ========================================================================= */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingEvent ? 'Edit Event Details' : 'Create New Event'}
              </h3>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Event Name *</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingEvent?.name || ''}
                  required
                  placeholder="e.g. SUSTAINOVA"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Event Description</label>
                <textarea
                  name="description"
                  defaultValue={editingEvent?.description || ''}
                  rows={3}
                  placeholder="Focus of the workshop/symposium..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Event Date</label>
                  <input
                    type="text"
                    name="date"
                    defaultValue={editingEvent?.date || '11 November 2026'}
                    placeholder="e.g. 11 November 2026"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    name="startTime"
                    defaultValue={editingEvent?.startTime || '09:00 AM'}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    name="endTime"
                    defaultValue={editingEvent?.endTime || '04:00 PM'}
                    placeholder="04:00 PM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Venue</label>
                  <input
                    type="text"
                    name="venue"
                    defaultValue={editingEvent?.venue || 'Ramanujan Hall, MKCE'}
                    placeholder="e.g. Ramanujan Hall, MKCE"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Registration Status</label>
                  <select
                    name="registrationStatus"
                    defaultValue={editingEvent?.registrationStatus || 'open'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Resource Person</label>
                  <input
                    type="text"
                    name="resourcePerson"
                    defaultValue={editingEvent?.resourcePerson || 'Dr. G. Balaji'}
                    placeholder="e.g. Dr. G. Balaji"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    name="resourcePersonDesignation"
                    defaultValue={editingEvent?.resourcePersonDesignation || 'Assistant Professor & HoD'}
                    placeholder="e.g. Assistant Professor & HoD"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    name="resourcePersonDepartment"
                    defaultValue={editingEvent?.resourcePersonDepartment || 'Civil Engineering, MKCE'}
                    placeholder="e.g. Civil Engineering, MKCE"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD STUDENT TO ATTENDANCE */}
      {/* ========================================================================= */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Student to Attendance</h3>
                <p className="text-[11px] text-slate-500">Search from the existing student roster</p>
              </div>
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Search Student (Name or Register Number)
                </label>
                <input
                  type="text"
                  value={addStudentSearch}
                  onChange={(e) => setAddStudentSearch(e.target.value)}
                  placeholder="Enter name or reg no..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  autoFocus
                />
              </div>

              {/* Matched results list */}
              {addStudentSearch.trim() && (
                <div className="border border-slate-200 rounded-xl max-h-44 overflow-y-auto divide-y divide-slate-100">
                  {students
                    .filter(s => {
                      const q = addStudentSearch.toLowerCase().trim();
                      return s.name.toLowerCase().includes(q) || s.registerNumber.toLowerCase().includes(q);
                    })
                    .slice(0, 8)
                    .map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStudentToAdd(st)}
                        className={`w-full p-2.5 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          selectedStudentToAdd?.id === st.id ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <span className="font-bold block">{st.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{st.registerNumber} • {st.department}</span>
                        </div>
                        {selectedStudentToAdd?.id === st.id && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                </div>
              )}

              {/* Selected Student Confirmation Card */}
              {selectedStudentToAdd && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="font-extrabold text-emerald-950">
                    {selectedStudentToAdd.name} ({selectedStudentToAdd.registerNumber})
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    Dept: {selectedStudentToAdd.department}
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <span className="font-bold text-slate-700">Initial Status:</span>
                    <button
                      type="button"
                      onClick={() => setAddStudentAttendanceStatus('PRESENT')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        addStudentAttendanceStatus === 'PRESENT'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-700'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddStudentAttendanceStatus('ABSENT')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        addStudentAttendanceStatus === 'ABSENT'
                          ? 'bg-rose-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-700'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedStudentToAdd}
                  onClick={handleAddStudentToAttendance}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Add to Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

