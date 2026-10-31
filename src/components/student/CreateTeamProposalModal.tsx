import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  UserPlus, 
  Trash2, 
  Crown, 
  Sparkles, 
  Send, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  HelpCircle,
  Hash
} from 'lucide-react';
import { StudentProfile, TeamMember, TeamProposalRequest } from '../../types';
import { storageService } from '../../services/storageService';

interface CreateTeamProposalModalProps {
  currentStudent: StudentProfile;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (req: TeamProposalRequest) => void;
}

const COMMON_ROLES = [
  'Team Leader & Project Lead',
  'Full Stack & Web Developer',
  'Structural Designer & CAD Modeler',
  'Hardware & IoT Specialist',
  'Materials & Concrete Specialist',
  'UI/UX & Product Designer',
  'Documentation & Presentation Lead',
  'Core Technical Researcher'
];

export const CreateTeamProposalModal: React.FC<CreateTeamProposalModalProps> = ({
  currentStudent,
  isOpen,
  onClose,
  onSubmitted
}) => {
  const [teamName, setTeamName] = useState('');
  const [targetSize, setTargetSize] = useState<number>(4);
  const [projectDomain, setProjectDomain] = useState('Smart Infrastructure & AI');
  const [targetCompetition, setTargetCompetition] = useState('Smart India Hackathon (SIH) / Tech Symposium');
  const [notes, setNotes] = useState('');
  
  // Proposed Members
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize with current student as Leader
  useEffect(() => {
    if (isOpen) {
      setMembers([
        {
          studentId: currentStudent.id,
          registerNumber: currentStudent.registerNumber,
          name: currentStudent.name,
          department: currentStudent.department,
          assignedRole: 'Team Leader & Project Lead',
          isLeader: true
        }
      ]);
      setTeamName('');
      setNotes('');
      setErrorMessage(null);
      setSuccessMessage(null);

      // Load roster of students for adding members
      storageService.getStudents().then(list => {
        setAllStudents(list.filter(s => !s.isArchived));
      });
    }
  }, [isOpen, currentStudent]);

  if (!isOpen) return null;

  // Filter students for member picker
  const matchingStudents = allStudents.filter(s => {
    if (members.some(m => m.studentId.toLowerCase() === s.id.toLowerCase())) {
      return false; // Already in team
    }
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      s.registerNumber.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q)
    );
  }).slice(0, 5);

  const handleAddMember = (student: StudentProfile) => {
    if (members.length >= targetSize) {
      setErrorMessage(`Squad size is currently set to ${targetSize} members. Increase team size if needed.`);
      return;
    }
    setMembers(prev => [
      ...prev,
      {
        studentId: student.id,
        registerNumber: student.registerNumber,
        name: student.name,
        department: student.department,
        assignedRole: 'Core Technical Specialist',
        isLeader: false
      }
    ]);
    setSearchQuery('');
    setErrorMessage(null);
  };

  const handleRemoveMember = (studentId: string) => {
    if (studentId.toLowerCase() === currentStudent.id.toLowerCase()) {
      setErrorMessage('You cannot remove yourself from your proposed team.');
      return;
    }
    setMembers(prev => prev.filter(m => m.studentId !== studentId));
    setErrorMessage(null);
  };

  const handleRoleChange = (studentId: string, role: string) => {
    setMembers(prev => prev.map(m => m.studentId === studentId ? { ...m, assignedRole: role } : m));
  };

  const handleLeaderToggle = (studentId: string) => {
    setMembers(prev => prev.map(m => ({
      ...m,
      isLeader: m.studentId === studentId
    })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!teamName.trim()) {
      setErrorMessage('Please enter a unique name for your proposed squad.');
      return;
    }

    if (members.length < 2) {
      setErrorMessage('A team proposal must include at least 2 members.');
      return;
    }

    if (!members.some(m => m.isLeader)) {
      setErrorMessage('Please designate at least one Team Leader.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await storageService.createTeamRequest({
        teamName: teamName.trim(),
        targetSize,
        projectDomain: projectDomain.trim(),
        targetCompetition: targetCompetition.trim(),
        members,
        submittedByStudentId: currentStudent.id,
        submittedByStudentName: currentStudent.name,
        submittedByStudentRegNo: currentStudent.registerNumber,
        notes: notes.trim()
      });

      setSuccessMessage('Your team proposal has been successfully submitted to faculty and administrators!');
      setTimeout(() => {
        onSubmitted(created);
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit team proposal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto font-sans">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-800/80 border border-blue-700/60 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif leading-tight">Create & Propose Project Squad</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Assemble your teammates, assign specialized roles, and submit for Faculty & Admin approval.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Proposed Squad Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AI Eco-Builders, Concrete Dynamos, Smart GeoTech..."
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Project Domain / Technical Focus <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Smart Infrastructure & IoT, Green Concrete..."
                value={projectDomain}
                onChange={e => setProjectDomain(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Target Team Size (2 - 6 Members)
              </label>
              <select
                value={targetSize}
                onChange={e => setTargetSize(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 font-semibold"
              >
                <option value={2}>2 Members (Duo)</option>
                <option value={3}>3 Members (Trio)</option>
                <option value={4}>4 Members (Standard Quad)</option>
                <option value={5}>5 Members (Extended Squad)</option>
                <option value={6}>6 Members (Maximum Hackathon Squad)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Target Competition or Capstone Initiative
              </label>
              <input
                type="text"
                placeholder="e.g. Smart India Hackathon (SIH), ICI Student Contest, Final Year Project..."
                value={targetCompetition}
                onChange={e => setTargetCompetition(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Members Assignment Section */}
          <div className="border border-slate-200 rounded-2xl p-4.5 bg-slate-50/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs font-serif flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-blue-700" />
                  Squad Members ({members.length} / {targetSize})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Search registered classmates to add them to your roster and assign their specialized roles.
                </p>
              </div>
            </div>

            {/* Member Search Picker */}
            {members.length < targetSize && (
              <div className="space-y-1.5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search classmate by name, register number or branch..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs border border-blue-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {matchingStudents.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-md divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {matchingStudents.map(s => (
                      <div key={s.id} className="py-2 px-2 flex items-center justify-between hover:bg-blue-50/60 rounded-lg transition-colors">
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-slate-900 block truncate">{s.name}</span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {s.registerNumber} • {s.department} • {s.academicYear}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddMember(s)}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 rounded-lg cursor-pointer transition-colors shrink-0"
                        >
                          + Add to Squad
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Current Members List */}
            <div className="space-y-2">
              {members.map((m, idx) => {
                const isSelf = m.studentId.toLowerCase() === currentStudent.id.toLowerCase();
                return (
                  <div 
                    key={m.studentId}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-950 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 truncate">{m.name}</span>
                          {isSelf && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              You (Submitter)
                            </span>
                          )}
                          {m.isLeader && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Crown className="w-2.5 h-2.5 text-amber-600" /> Leader
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {m.registerNumber} • {m.department}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex-1 sm:w-48">
                        <input
                          type="text"
                          list="roles-list"
                          placeholder="Select or type role..."
                          value={m.assignedRole}
                          onChange={e => handleRoleChange(m.studentId, e.target.value)}
                          className="w-full px-2.5 py-1 text-[11px] border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLeaderToggle(m.studentId)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          m.isLeader 
                            ? 'bg-amber-100 border-amber-300 text-amber-800' 
                            : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-700'
                        }`}
                        title={m.isLeader ? 'Leader designated' : 'Designate as Leader'}
                      >
                        <Crown className="w-3.5 h-3.5" />
                      </button>

                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.studentId)}
                          className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove from squad"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <datalist id="roles-list">
              {COMMON_ROLES.map(r => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>

          {/* Proposal Description / Pitch Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Project Concept & Squad Motivation (Optional Pitch)
            </label>
            <textarea
              rows={2}
              placeholder="Explain why this team is forming, your core project idea, or specific mentorship requirements..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900"
            />
          </div>

          {/* Institutional Submission Notice */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-[11px] flex items-start gap-2">
            <HelpCircle className="w-4 h-4 shrink-0 text-blue-700 mt-0.5" />
            <p className="leading-relaxed">
              Once submitted, your proposal will be routed to the <strong>Faculty Mentors & Department Admin Review Queue</strong>. 
              Upon approval, your official team code (e.g. <code>TM001</code>) will be generated and published to the department roster.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 shrink-0 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting Proposal...' : 'Submit Team for Approval'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
