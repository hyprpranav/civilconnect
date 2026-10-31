import React, { useState, useEffect } from 'react';
import { 
  UserAccount, 
  StudentProfile, 
  OfficerRequest, 
  RequestCategory, 
  Department, 
  AcademicYear,
  ALL_DEPARTMENTS,
  PendingAccountRequest
} from '../../types';
import { storageService } from '../../services/storageService';
import { AdminAnalyticsView } from '../admin/AdminAnalyticsView';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Eye, 
  Edit2, 
  Briefcase, 
  Building2,
  Calendar,
  Lock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X,
  BarChart3,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Save,
  GraduationCap,
  Sparkles
} from 'lucide-react';

interface OfficerDashboardProps {
  user: UserAccount;
  students: StudentProfile[];
  onRefreshData: () => void;
  externalTab?: string;
  onTabChange?: (tab: string) => void;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({
  user,
  students,
  onRefreshData,
  externalTab,
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'analytics' | 'requests' | 'addStudent'>('students');

  React.useEffect(() => {
    if (externalTab) {
      if (externalTab === 'dashboard') {
        setActiveTab('students');
      } else if (['students', 'analytics', 'requests', 'addStudent'].includes(externalTab)) {
        setActiveTab(externalTab as any);
      }
    }
  }, [externalTab]);

  const handleTabChange = (tab: 'students' | 'analytics' | 'requests' | 'addStudent') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const [requests, setRequests] = useState<OfficerRequest[]>([]);
  const [pendingStudentSignups, setPendingStudentSignups] = useState<PendingAccountRequest[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');

  // Selected student for detail modal
  const [viewingStudent, setViewingStudent] = useState<StudentProfile | null>(null);
  const [isEditingInModal, setIsEditingInModal] = useState(false);
  const [modalEditPhone, setModalEditPhone] = useState('');
  const [modalEditEmail, setModalEditEmail] = useState('');
  const [modalEditYear, setModalEditYear] = useState<AcademicYear>('2nd Year');
  const [modalEditClub, setModalEditClub] = useState('');
  const [modalEditFeedback, setModalEditFeedback] = useState<string | null>(null);

  // New Request Form State
  const [requestCategory, setRequestCategory] = useState<RequestCategory>('Student Data Modification');
  const [requestDescription, setRequestDescription] = useState('');
  const [affectedRecordsText, setAffectedRecordsText] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);

  // Add Student Form State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentReg, setNewStudentReg] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentDept, setNewStudentDept] = useState<Department>('Civil Engineering');
  const [newStudentYear, setNewStudentYear] = useState<AcademicYear>('2nd Year');
  const [newStudentClub, setNewStudentClub] = useState('Civil Engineers Association (CEA)');
  const [addFeedback, setAddFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  useEffect(() => {
    loadRequests();
    loadPendingStudentSignups();
  }, []);

  const loadRequests = async () => {
    try {
      const allRequests = await storageService.getRequests();
      setRequests(allRequests);
    } catch (err) {
      console.error('Failed to load requests', err);
    }
  };

  const loadPendingStudentSignups = async () => {
    try {
      const allReqs = await storageService.getPendingAccountRequests();
      setPendingStudentSignups(allReqs.filter(r => r.role === 'STUDENT' && r.status === 'pending'));
    } catch (err) {
      console.error('Failed to load pending student signups', err);
    }
  };

  const handleApproveStudentSignup = async (reqId: string) => {
    try {
      const res = await storageService.approveAccountRequest(reqId, user);
      alert(res.message);
      await loadPendingStudentSignups();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve student signup.');
    }
  };

  const handleRejectStudentSignup = async (reqId: string) => {
    if (!window.confirm('Decline this student account request?')) return;
    try {
      const res = await storageService.rejectAccountRequest(reqId);
      alert(res.message);
      await loadPendingStudentSignups();
    } catch (err: any) {
      alert(err.message || 'Failed to decline request.');
    }
  };

  const handleQuickVerifyStudent = async (student: StudentProfile) => {
    try {
      const updated: StudentProfile = {
        ...student,
        profileStatus: 'verified',
        updatedAt: new Date().toISOString()
      };
      await storageService.saveStudent(updated);
      onRefreshData();
      if (viewingStudent?.id === student.id) {
        setViewingStudent(updated);
      }
    } catch (err) {
      console.error('Failed to verify student', err);
    }
  };

  const handleSaveModalEdits = async () => {
    if (!viewingStudent) return;
    try {
      const updated: StudentProfile = {
        ...viewingStudent,
        phone: modalEditPhone.trim() || viewingStudent.phone,
        email: modalEditEmail.trim() || viewingStudent.email,
        academicYear: modalEditYear,
        club: modalEditClub.trim() || viewingStudent.club,
        updatedAt: new Date().toISOString()
      };
      await storageService.saveStudent(updated);
      setViewingStudent(updated);
      setIsEditingInModal(false);
      setModalEditFeedback('Student record updated successfully!');
      onRefreshData();
    } catch (err: any) {
      setModalEditFeedback(err.message || 'Failed to save student edits.');
    }
  };

  // Filter students (Supports all 12 departments!)
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.registerNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'All' || s.department === deptFilter;
    const matchesYear = yearFilter === 'All' || s.academicYear === yearFilter;
    return matchesSearch && matchesDept && matchesYear;
  });

  // Calculate Officer Overview Metrics
  const totalAssigned = students.length;
  const verifiedCount = students.filter(s => s.profileStatus === 'verified').length;
  const pendingReviewCount = students.filter(s => s.profileStatus === 'pending_review').length;
  const avgCompletion = Math.round(
    students.reduce((acc, curr) => acc + curr.profileCompletionPercentage, 0) / (totalAssigned || 1)
  );

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestDescription.trim()) return;

    setIsSubmittingRequest(true);
    setRequestFeedback(null);
    try {
      const ids = affectedRecordsText
        .split(',')
        .map(i => i.trim().toLowerCase())
        .filter(Boolean);

      await storageService.createRequest({
        submittedBy: {
          uid: user.uid,
          name: user.name,
          email: user.email,
          role: user.role
        },
        category: requestCategory,
        description: requestDescription.trim(),
        affectedRecordIds: ids
      });

      setRequestFeedback('Request submitted successfully to Department Admin for authorization.');
      setRequestDescription('');
      setAffectedRecordsText('');
      await loadRequests();
      onRefreshData();
    } catch (err: any) {
      setRequestFeedback(err.message || 'Failed to dispatch request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentReg.trim()) return;

    setIsAddingStudent(true);
    setAddFeedback(null);
    try {
      const res = await storageService.addStudent({
        name: newStudentName.trim().toUpperCase(),
        registerNumber: newStudentReg.trim().toUpperCase(),
        email: newStudentEmail.trim().toLowerCase(),
        phone: newStudentPhone.trim(),
        department: newStudentDept,
        academicYear: newStudentYear,
        club: newStudentClub
      });

      setAddFeedback(res);
      if (res.success) {
        setNewStudentName('');
        setNewStudentReg('');
        setNewStudentEmail('');
        setNewStudentPhone('');
        onRefreshData();
      }
    } catch (err: any) {
      setAddFeedback({ success: false, message: err.message || 'Failed to add student.' });
    } finally {
      setIsAddingStudent(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Verified
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300">
            <XCircle className="w-3.5 h-3.5 text-red-700" /> Rejected
          </span>
        );
      case 'Under Review':
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700" /> Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Officer Header Card (Clear & Bold) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">
              Faculty Advisor / Officer Portal
            </span>
            <span className="text-xs text-slate-500 font-mono font-bold">Officer: {user.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950 font-serif mt-1.5">
            Cohort Student Management Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Search, verify student talent cards, review departmental analytics, and manage cohort registrations.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleTabChange('analytics')}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'text-indigo-950 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" /> 
            <span>Skill Analytics & Pie Charts</span>
          </button>

          <button
            onClick={() => handleTabChange('addStudent')}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer ${
              activeTab === 'addStudent'
                ? 'bg-blue-950 text-white'
                : 'bg-blue-900 hover:bg-blue-950 text-white'
            }`}
          >
            <Plus className="w-4 h-4" /> Add Student Record
          </button>

          <button
            onClick={() => handleTabChange('requests')}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-teal-900 text-white'
                : 'text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-300'
            }`}
          >
            <Send className="w-4 h-4 text-teal-700" /> 
            <span>Requests Center</span>
            {pendingStudentSignups.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-extrabold">
                {pendingStudentSignups.length} New
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Large Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Enrolled Cohort</span>
            <Users className="w-5 h-5 text-blue-700" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{totalAssigned}</p>
          <p className="text-xs text-slate-500 font-medium">All active student records in database</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-amber-900">{pendingReviewCount}</p>
          <p className="text-xs text-slate-500 font-medium">Profiles requiring faculty verification</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Verified Profiles</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-900">{verifiedCount}</p>
          <p className="text-xs text-slate-500 font-medium">Form completed & confirmed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Average Completion</span>
            <TrendingUp className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-3xl font-extrabold text-teal-900">{avgCompletion}%</p>
          <p className="text-xs text-slate-500 font-medium">Across all competencies & skills</p>
        </div>
      </div>

      {/* TAB 1: STUDENT DIRECTORY (Enhanced, highly readable UI!) */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-5 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                Registered Student Database ({filteredStudents.length})
              </h2>
              <p className="text-xs text-slate-500">
                Filter by any of the 12 engineering departments or search directly.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {filteredStudents.length} Students
            </span>
          </div>

          {/* Search and All 12 Departments Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by student name, register number or email..."
                className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm font-medium border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl bg-white shadow-2xs max-w-[280px]"
              >
                <option value="All">All Departments ({students.length})</option>
                {ALL_DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl bg-white shadow-2xs"
              >
                <option value="All">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>

          {/* Large, High-Contrast Student Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Student Profile</th>
                  <th className="py-3.5 px-4">Register Number</th>
                  <th className="py-3.5 px-4">Department & Year</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Completion</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                      No student records match the selected search or department filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.slice(0, 30).map(s => (
                    <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-300 text-blue-900 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                            {s.profileImage ? (
                              <img src={s.profileImage} alt={s.name} className="w-full h-full object-cover" />
                            ) : (
                              s.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-950 text-sm block">
                              {s.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {s.club || 'Engineering Association'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-xs text-blue-950 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                          {s.registerNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-900 block text-xs">
                            {s.department}
                          </span>
                          <span className="inline-block text-[10px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {s.academicYear}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-600 space-y-0.5">
                          <p className="font-mono text-slate-800">{s.phone || 'N/A'}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[160px]">{s.email}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{s.profileCompletionPercentage}%</span>
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                s.profileCompletionPercentage === 100 ? 'bg-emerald-600' : 'bg-blue-600'
                              }`}
                              style={{ width: `${s.profileCompletionPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(s.profileStatus)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.profileStatus !== 'verified' && (
                            <button
                              onClick={() => handleQuickVerifyStudent(s)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer"
                              title="Instantly mark verified"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Verify</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setViewingStudent(s);
                              setModalEditPhone(s.phone || '');
                              setModalEditEmail(s.email || '');
                              setModalEditYear(s.academicYear);
                              setModalEditClub(s.club || '');
                              setIsEditingInModal(false);
                              setModalEditFeedback(null);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Card</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 font-medium">
            <span>Showing top {Math.min(30, filteredStudents.length)} of {filteredStudents.length} filtered students</span>
            <span>Total enrolled records: {students.length}</span>
          </div>
        </div>
      )}

      {/* TAB 1.5: ANALYTICS & PIE CHARTS (Officer View) */}
      {activeTab === 'analytics' && (
        <AdminAnalyticsView
          students={students}
          onOpenAirProfileCard={s => setViewingStudent(s)}
          titlePrefix="Faculty Officer"
        />
      )}

      {/* TAB 2: OFFICER REQUESTS & STUDENT SIGNUP APPROVALS */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* SECTION A: PENDING STUDENT REGISTRATIONS (Officer Approval Power) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif">
                    New Student Account Requests ({pendingStudentSignups.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Students who registered online requiring department verification. Officers can approve directly.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Awaiting Verification
              </span>
            </div>

            {pendingStudentSignups.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">All student registration requests have been cleared!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">When new students sign up, they will appear here for 1-click authorization.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingStudentSignups.map(req => (
                  <div key={req.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{req.name}</h4>
                        <p className="text-xs font-mono font-bold text-blue-900">{req.registerNumber || 'Reg No. Pending'}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {req.academicYear || '1st Year'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                      <p><strong>Department:</strong> {req.department}</p>
                      <p><strong>Email:</strong> {req.email}</p>
                      <p><strong>Phone:</strong> {req.phone}</p>
                      <p className="text-[10px] text-slate-400">Requested: {new Date(req.requestedAt).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleRejectStudentSignup(req.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleApproveStudentSignup(req.id)}
                        className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve Student
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION B: SUBMIT REQUEST TO ADMIN + REQUEST TRACKING */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Submit New Request Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                  <Send className="w-4 h-4 text-teal-700" /> Submit Request to Master Admin
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Submit formal requests for administrative approvals, large bulk modifications, or deletions.
                </p>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Request Category:
                  </label>
                  <select
                    value={requestCategory}
                    onChange={e => setRequestCategory(e.target.value as RequestCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Student Data Modification">Student Data Modification</option>
                    <option value="Student Account Deletion">Student Account Deletion</option>
                    <option value="New Student Addition">New Student Addition</option>
                    <option value="Bulk Student Deletion">Bulk Student Deletion</option>
                    <option value="Bulk Data Modification">Bulk Data Modification</option>
                    <option value="Other Administrative Requests">Other Administrative Requests</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Affected Register Number(s):
                  </label>
                  <input
                    type="text"
                    value={affectedRecordsText}
                    onChange={e => setAffectedRecordsText(e.target.value)}
                    placeholder="e.g. 927623BCE012, 927623BCE015"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  <span className="text-[10px] text-slate-400">Separate multiple with commas</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Justification & Details:
                  </label>
                  <textarea
                    rows={4}
                    value={requestDescription}
                    onChange={e => setRequestDescription(e.target.value)}
                    placeholder="Provide precise academic rationale or documentation reference for this modification..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                {requestFeedback && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 font-medium">
                    {requestFeedback}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmittingRequest ? 'Submitting...' : 'Dispatch Request to Admin'}
                </button>
              </form>
            </div>

            {/* Right: Request History */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  Request Tracking & Approval History ({requests.length})
                </h3>
                <span className="text-xs text-slate-400">Monitored by Harish Pranav S</span>
              </div>

              <div className="space-y-3">
                {requests.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No requests dispatched yet.
                  </div>
                ) : (
                  requests.map(req => (
                    <div key={req.requestId} className="border border-slate-200 rounded-xl p-4 space-y-2 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {req.requestId}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">
                            {req.category}
                          </span>
                        </div>
                        {getStatusBadge(req.status)}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {req.description}
                      </p>

                      {req.reviewComments && (
                        <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                          <span className="font-bold text-slate-900">Admin Review:</span> {req.reviewComments}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Submitted: {new Date(req.submissionDate).toLocaleDateString()}</span>
                        <span>By: {req.submittedBy.name}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ADD NEW STUDENT */}
      {activeTab === 'addStudent' && (
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Add Individual Student Record
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enroll a new student to any of the 12 engineering departments.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTabChange('students')}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Roster
            </button>
          </div>

          <form onSubmit={handleAddStudentSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
                placeholder="e.g. PRIYA DARSHINI"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Register Number</label>
                <input
                  type="text"
                  value={newStudentReg}
                  onChange={e => setNewStudentReg(e.target.value)}
                  placeholder="e.g. 927623BCE098"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
                <select
                  value={newStudentYear}
                  onChange={e => setNewStudentYear(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={newStudentDept}
                onChange={e => setNewStudentDept(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
              >
                {ALL_DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={e => setNewStudentEmail(e.target.value)}
                  placeholder="e.g. student@mkce.ac.in"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={newStudentPhone}
                  onChange={e => setNewStudentPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {addFeedback && (
              <div className={`p-3 rounded-lg text-xs font-medium ${
                addFeedback.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {addFeedback.message}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isAddingStudent}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isAddingStudent ? 'Saving...' : 'Register Student Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ENHANCED STUDENT VIEW & VERIFY MODAL */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-300 shrink-0 flex items-center justify-center font-bold text-xl text-blue-900 shadow-xs">
                  {viewingStudent.profileImage ? (
                    <img src={viewingStudent.profileImage} alt={viewingStudent.name} className="w-full h-full object-cover" />
                  ) : (
                    viewingStudent.name.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-950 font-serif">{viewingStudent.name}</h3>
                  <p className="text-xs text-blue-950 font-mono font-bold mt-0.5">
                    {viewingStudent.registerNumber} • {viewingStudent.department} • {viewingStudent.academicYear}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewingStudent(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalEditFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900">
                {modalEditFeedback}
              </div>
            )}

            {/* Quick Actions Bar */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Verification Status:</span>
                {getStatusBadge(viewingStudent.profileStatus)}
              </div>

              <div className="flex items-center gap-2">
                {viewingStudent.profileStatus !== 'verified' && (
                  <button
                    onClick={() => handleQuickVerifyStudent(viewingStudent)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Verify Student Profile
                  </button>
                )}
                <button
                  onClick={() => setIsEditingInModal(!isEditingInModal)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditingInModal ? 'Cancel Edit' : 'Edit Details'}</span>
                </button>
              </div>
            </div>

            {/* Edit Mode vs View Mode */}
            {isEditingInModal ? (
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3 text-xs">
                <h4 className="font-bold text-blue-950 text-xs uppercase tracking-wider">
                  Update Student Record Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={modalEditPhone}
                      onChange={e => setModalEditPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={modalEditEmail}
                      onChange={e => setModalEditEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
                    <select
                      value={modalEditYear}
                      onChange={e => setModalEditYear(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Club / Association</label>
                    <input
                      type="text"
                      value={modalEditClub}
                      onChange={e => setModalEditClub(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveModalEdits}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-lg shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Email</span>
                  <p className="font-semibold text-slate-900 truncate">{viewingStudent.email || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Phone</span>
                  <p className="font-semibold text-slate-900">{viewingStudent.phone || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Club</span>
                  <p className="font-semibold text-slate-900 truncate">{viewingStudent.club || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Completion</span>
                  <p className="font-bold text-blue-900">{viewingStudent.profileCompletionPercentage}%</p>
                </div>
              </div>
            )}

            {/* Recorded Skills */}
            {viewingStudent.skills && viewingStudent.skills.strongestSkills && viewingStudent.skills.strongestSkills.length > 0 && (
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-900 text-xs">Documented Core Skills:</span>
                <div className="flex flex-wrap gap-1.5">
                  {viewingStudent.skills.strongestSkills.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 text-xs font-semibold border border-blue-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Team Roles */}
            {viewingStudent.teamStrengths && viewingStudent.teamStrengths.roles && viewingStudent.teamStrengths.roles.length > 0 && (
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-900 text-xs">Preferred Competition Squad Roles:</span>
                <div className="flex flex-wrap gap-1.5">
                  {viewingStudent.teamStrengths.roles.map(r => (
                    <span key={r} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 text-xs font-semibold border border-indigo-200">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
