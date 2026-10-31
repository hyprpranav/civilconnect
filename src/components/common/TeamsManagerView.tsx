import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Sparkles, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Crown, 
  X, 
  Save, 
  Building2, 
  Filter, 
  Layers, 
  Hash, 
  Calendar, 
  UserCheck, 
  AlertCircle,
  FileText,
  Send,
  Eye,
  Info
} from 'lucide-react';
import { TeamFormation, TeamMember, StudentProfile, UserAccount, Department } from '../../types';
import { storageService } from '../../services/storageService';
import { teamService } from '../../services/teamService';

interface TeamsManagerViewProps {
  currentUser: UserAccount;
  students: StudentProfile[];
  onTeamUpdated?: () => void;
}

const AVAILABLE_ROLES = [
  'Team Leader',
  'Core Technical Engineer',
  'Hardware & Structural Prototyper',
  'Software & IoT Specialist',
  'Research & Documentation Lead',
  'Presentation & Pitching Specialist',
  'Operations & Logistics Lead'
];

export const TeamsManagerView: React.FC<TeamsManagerViewProps> = ({
  currentUser,
  students,
  onTeamUpdated
}) => {
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  const [teams, setTeams] = useState<TeamFormation[]>([]);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'finalised' | 'drafts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');

  // Modal State for Create / Edit Team
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  // Form Fields
  const [formTeamName, setFormTeamName] = useState('');
  const [formTeamNumber, setFormTeamNumber] = useState('');
  const [formCodeNumber, setFormCodeNumber] = useState('927624'); // default 6-digit institutional code
  const [formTargetSize, setFormTargetSize] = useState<number>(5);
  const [formDomain, setFormDomain] = useState('');
  const [formTargetCompetition, setFormTargetCompetition] = useState('Smart India Hackathon / Technical Symposium');
  const [formNotes, setFormNotes] = useState('');
  const [formMembers, setFormMembers] = useState<TeamMember[]>([]);

  // Member search inside modal
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Algorithmic Assistant State
  const [isAutoSuggestOpen, setIsAutoSuggestOpen] = useState(false);
  const [autoDomain, setAutoDomain] = useState('Smart Infrastructure');
  const [autoDraft, setAutoDraft] = useState<TeamFormation | null>(null);

  // Load teams on mount
  const loadTeams = async () => {
    try {
      const allTeams = await storageService.getTeams();
      setTeams(allTeams);
    } catch (err) {
      console.error('Failed to load teams', err);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  // Filtered Teams based on Visibility rules:
  // - If team is 'Draft', ONLY creator sees it (or Admin if viewing admin overview)
  // - If team is 'Finalised' (or other non-draft status), all staff & admin see it
  const visibleTeams = useMemo(() => {
    return teams.filter(t => {
      const isDraft = t.status === 'Draft';
      const isCreator = (t.creatorUid && t.creatorUid === currentUser.uid) || 
                        (t.createdBy && t.createdBy.toLowerCase() === currentUser.name.toLowerCase());
      
      // If it's a draft, only creator or admin can see it
      if (isDraft && !isCreator && !isAdmin) {
        return false;
      }

      // Tab filter
      if (activeTabFilter === 'finalised' && isDraft) return false;
      if (activeTabFilter === 'drafts' && !isDraft) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = t.teamName.toLowerCase().includes(q);
        const matchesNumber = (t.teamNumber || '').toLowerCase().includes(q);
        const matchesCode = (t.codeNumber || '').includes(q);
        const matchesDomain = (t.projectDomain || '').toLowerCase().includes(q);
        const matchesCreator = (t.createdBy || '').toLowerCase().includes(q);
        const matchesMember = t.members.some(m => 
          m.name.toLowerCase().includes(q) || m.registerNumber.toLowerCase().includes(q)
        );

        if (!matchesName && !matchesNumber && !matchesCode && !matchesDomain && !matchesCreator && !matchesMember) {
          return false;
        }
      }

      // Domain filter
      if (domainFilter !== 'ALL' && t.projectDomain !== domainFilter) {
        return false;
      }

      return true;
    });
  }, [teams, currentUser, isAdmin, activeTabFilter, searchQuery, domainFilter]);

  // Counts for tabs
  const finalisedCount = teams.filter(t => t.status !== 'Draft').length;
  const myDraftsCount = teams.filter(t => 
    t.status === 'Draft' && 
    ((t.creatorUid && t.creatorUid === currentUser.uid) || (t.createdBy && t.createdBy.toLowerCase() === currentUser.name.toLowerCase()))
  ).length;

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingTeamId(null);
    const nextNum = teams.length + 1;
    setFormTeamName(`Squad ${nextNum < 10 ? '0' + nextNum : nextNum}`);
    setFormTeamNumber(`Team ${nextNum < 10 ? '0' + nextNum : nextNum}`);
    setFormCodeNumber('927624'); // default 6-digit institutional code
    setFormTargetSize(5);
    setFormDomain('Civil Engineering & Smart Cities');
    setFormTargetCompetition('Smart India Hackathon / Technical Symposium');
    setFormNotes('');
    setFormMembers([]);
    setMemberSearchQuery('');
    setFeedback(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (team: TeamFormation) => {
    setEditingTeamId(team.id);
    setFormTeamName(team.teamName);
    setFormTeamNumber(team.teamNumber || '');
    setFormCodeNumber(team.codeNumber || '927624');
    setFormTargetSize(team.targetSize || 5);
    setFormDomain(team.projectDomain || '');
    setFormTargetCompetition(team.targetCompetition || '');
    setFormNotes(team.notes || '');
    setFormMembers([...team.members]);
    setMemberSearchQuery('');
    setFeedback(null);
    setIsModalOpen(true);
  };

  // Search candidates to add into team
  const searchedCandidates = useMemo(() => {
    if (!memberSearchQuery.trim()) return [];
    const q = memberSearchQuery.toLowerCase().trim();
    const existingIds = new Set(formMembers.map(m => m.studentId.toLowerCase()));

    return students
      .filter(s => {
        if (existingIds.has(s.id.toLowerCase())) return false;
        const reg = s.registerNumber.toLowerCase();
        const name = s.name.toLowerCase();
        const dept = (s.department || '').toLowerCase();
        return reg.includes(q) || name.includes(q) || dept.includes(q);
      })
      .slice(0, 8);
  }, [students, memberSearchQuery, formMembers]);

  // Add member to form
  const handleAddMember = (student: StudentProfile) => {
    if (formMembers.length >= formTargetSize) {
      setFeedback({
        type: 'error',
        text: `Target team size is ${formTargetSize}. Increase team size to add more members.`
      });
      return;
    }

    const isFirstMember = formMembers.length === 0;
    const newMember: TeamMember = {
      studentId: student.id,
      registerNumber: student.registerNumber,
      name: student.name,
      department: student.department,
      assignedRole: isFirstMember ? 'Team Leader' : 'Core Technical Engineer',
      isLeader: isFirstMember
    };

    setFormMembers(prev => [...prev, newMember]);
    setMemberSearchQuery('');
    setFeedback(null);
  };

  // Remove member from form
  const handleRemoveMember = (studentId: string) => {
    setFormMembers(prev => prev.filter(m => m.studentId !== studentId));
  };

  // Set member role
  const handleSetMemberRole = (studentId: string, role: string) => {
    setFormMembers(prev => prev.map(m => {
      if (m.studentId === studentId) {
        return { ...m, assignedRole: role, isLeader: role === 'Team Leader' || m.isLeader };
      }
      return m;
    }));
  };

  // Set team leader
  const handleSetLeader = (studentId: string) => {
    setFormMembers(prev => prev.map(m => ({
      ...m,
      isLeader: m.studentId === studentId,
      assignedRole: m.studentId === studentId ? 'Team Leader' : (m.assignedRole === 'Team Leader' ? 'Core Technical Engineer' : m.assignedRole)
    })));
  };

  // Save Team (Draft or Finalised)
  const handleSaveTeam = async (targetStatus: 'Draft' | 'Finalised') => {
    if (!formTeamName.trim()) {
      setFeedback({ type: 'error', text: 'Please enter a valid Team Name.' });
      return;
    }

    if (targetStatus === 'Finalised' && formMembers.length === 0) {
      setFeedback({ type: 'error', text: 'Please add at least 1 student member before confirming and finalising the team.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const now = new Date().toISOString();
      const existingTeam = editingTeamId ? teams.find(t => t.id === editingTeamId) : null;

      const teamToSave: TeamFormation = {
        id: editingTeamId || `team_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        teamNumber: formTeamNumber.trim() || `Team ${teams.length + 1}`,
        teamName: formTeamName.trim(),
        codeNumber: formCodeNumber.trim() || '927624',
        targetSize: Number(formTargetSize) || 5,
        projectDomain: formDomain.trim() || 'General Engineering',
        members: formMembers,
        targetCompetition: formTargetCompetition.trim(),
        createdBy: existingTeam ? existingTeam.createdBy : currentUser.name,
        creatorUid: existingTeam ? existingTeam.creatorUid : currentUser.uid,
        creatorRole: existingTeam ? existingTeam.creatorRole : currentUser.role,
        createdAt: existingTeam ? existingTeam.createdAt : now,
        updatedAt: now,
        status: targetStatus,
        notes: formNotes.trim()
      };

      await storageService.saveTeam(teamToSave);
      await loadTeams();
      if (onTeamUpdated) onTeamUpdated();

      setFeedback({
        type: 'success',
        text: targetStatus === 'Draft' 
          ? 'Team saved as Draft! It remains privately within your dashboard until finalised.'
          : 'Team confirmed and finalised! It is now published and visible to all faculty and staff.'
      });

      setTimeout(() => {
        setIsModalOpen(false);
      }, 1000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save team.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Finalise Draft Team directly from card
  const handleQuickFinalise = async (team: TeamFormation) => {
    try {
      const updated: TeamFormation = {
        ...team,
        status: 'Finalised',
        updatedAt: new Date().toISOString()
      };
      await storageService.saveTeam(updated);
      await loadTeams();
      if (onTeamUpdated) onTeamUpdated();
    } catch (err) {
      console.error('Failed to quick finalise team', err);
    }
  };

  // Delete team
  const handleDeleteTeam = async (team: TeamFormation) => {
    const confirmMsg = `Are you sure you want to delete "${team.teamName}" (${team.teamNumber || 'No #'})? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await storageService.deleteTeam(team.id);
      await loadTeams();
      if (onTeamUpdated) onTeamUpdated();
    } catch (err) {
      console.error('Failed to delete team', err);
    }
  };

  // Algorithmic Assistant Handler
  const handleGenerateAlgorithmicDraft = async () => {
    try {
      const activeStudents = students.filter(s => !s.isArchived);
      const assignedIds = await teamService.getAssignedStudentIds();
      const unassigned = activeStudents.filter(s => !assignedIds.has(s.id.toLowerCase()));

      let candidates = unassigned.length >= 4 ? unassigned : activeStudents;
      if (candidates.length < 3) {
        alert('Not enough registered students available to form a complementary team.');
        return;
      }

      const shuffled = [...candidates].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 5);

      const generatedMembers: TeamMember[] = selected.map((s, index) => {
        let role = 'Core Technical Specialist';
        let isLeader = false;
        if (index === 0) {
          role = 'Team Leader & Coordinator';
          isLeader = true;
        } else if (index === 1) {
          role = 'Hardware & Structural Prototyper';
        } else if (index === 2) {
          role = 'Software & IoT Specialist';
        } else if (index === 3) {
          role = 'Research & Documentation Lead';
        } else {
          role = 'Presentation & Pitching Specialist';
        }

        return {
          studentId: s.id,
          registerNumber: s.registerNumber,
          name: s.name,
          department: s.department,
          assignedRole: role,
          isLeader
        };
      });

      const nextNum = teams.length + 1;
      const draft: TeamFormation = {
        id: `auto_${Date.now()}`,
        teamNumber: `Team ${nextNum < 10 ? '0' + nextNum : nextNum}`,
        teamName: `CIVIL Vanguard Squad ${nextNum}`,
        codeNumber: '927624',
        targetSize: 5,
        projectDomain: autoDomain,
        members: generatedMembers,
        targetCompetition: 'Smart India Hackathon',
        createdBy: currentUser.name,
        creatorUid: currentUser.uid,
        creatorRole: currentUser.role,
        createdAt: new Date().toISOString(),
        status: 'Draft'
      };

      setAutoDraft(draft);
    } catch (err) {
      console.error('Auto draft failed', err);
    }
  };

  // Import auto draft into editor
  const handleImportAutoDraft = () => {
    if (!autoDraft) return;
    setEditingTeamId(null);
    setFormTeamName(autoDraft.teamName);
    setFormTeamNumber(autoDraft.teamNumber || '');
    setFormCodeNumber(autoDraft.codeNumber || '927624');
    setFormTargetSize(autoDraft.targetSize || 5);
    setFormDomain(autoDraft.projectDomain);
    setFormTargetCompetition(autoDraft.targetCompetition || '');
    setFormNotes('Generated via Algorithmic Complementary Matcher');
    setFormMembers(autoDraft.members);
    setAutoDraft(null);
    setIsAutoSuggestOpen(false);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">

      {/* TOP HEADER & ACTION BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 mb-2">
            <Layers className="w-3.5 h-3.5 text-blue-700" />
            Institutional Team Command & Squad Management
          </div>
          <h2 className="text-xl font-bold font-serif text-slate-900 tracking-tight">
            Project & Hackathon Teams
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Create multidisciplinary squads, assign custom 6-digit institutional codes (<code className="font-mono text-blue-900 font-bold bg-blue-50 px-1 py-0.5 rounded">927624</code>), draft privately, and finalise for department-wide visibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsAutoSuggestOpen(!isAutoSuggestOpen)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-700" />
            <span>AI Matcher Assistant</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-teal-300" />
            <span>Create New Team</span>
          </button>
        </div>
      </div>

      {/* ALGORITHMIC ASSISTANT DRAWER */}
      {isAutoSuggestOpen && (
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-slate-50 border border-blue-200 rounded-2xl p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-700" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-serif">
                  Intelligent Complementary Team Matcher
                </h4>
                <p className="text-xs text-slate-500">
                  Auto-pairs 1 Team Leader, 2 Tech (Hardware/Software), 1 Research, and 1 Pitching Specialist from unassigned cohort students.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAutoSuggestOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Project Domain / Theme:
              </label>
              <input
                type="text"
                value={autoDomain}
                onChange={e => setAutoDomain(e.target.value)}
                placeholder="e.g. Smart Cities, Green Infrastructure, Structural AI"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
            <button
              onClick={handleGenerateAlgorithmicDraft}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-xs sm:self-end cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              Generate Draft Suggestion
            </button>
          </div>

          {/* Auto draft preview */}
          {autoDraft && (
            <div className="bg-white rounded-xl border border-indigo-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Generated Draft</span>
                  <h5 className="text-sm font-bold text-slate-900 font-serif">{autoDraft.teamName} ({autoDraft.teamNumber})</h5>
                </div>
                <button
                  onClick={handleImportAutoDraft}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs cursor-pointer"
                >
                  Edit & Save This Team
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {autoDraft.members.map(m => (
                  <div key={m.studentId} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{m.name}</span>
                      {m.isLeader && <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 rounded">Leader</span>}
                    </div>
                    <div className="text-[11px] font-mono text-blue-900">{m.registerNumber}</div>
                    <div className="text-[10px] text-teal-800 font-semibold">{m.assignedRole}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FILTER TABS & SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTabFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTabFilter === 'all'
                  ? 'bg-white text-blue-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Visible ({visibleTeams.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTabFilter('finalised')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTabFilter === 'finalised'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Finalised Teams ({finalisedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTabFilter('drafts')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTabFilter === 'drafts'
                  ? 'bg-white text-amber-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>My Drafts ({myDraftsCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team, number, code, member..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* TEAMS GRID LIST */}
      {visibleTeams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 font-serif">
            No Teams Found
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activeTabFilter === 'drafts'
              ? 'You do not have any private draft teams. Create a team and choose "Save as Draft" to work on it privately.'
              : 'No project teams have been registered matching your criteria. Click "Create New Team" to form the first squad.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Team Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {visibleTeams.map(team => {
            const isDraft = team.status === 'Draft';
            const isCreator = (team.creatorUid && team.creatorUid === currentUser.uid) || 
                              (team.createdBy && team.createdBy.toLowerCase() === currentUser.name.toLowerCase());
            const targetSize = team.targetSize || 5;
            const currentCount = team.members.length;

            return (
              <div 
                key={team.id}
                className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isDraft 
                    ? 'border-dashed border-amber-300 ring-2 ring-amber-100/50' 
                    : 'border-slate-200 shadow-2xs'
                }`}
              >
                {/* Team Card Top Header */}
                <div className={`p-4 sm:p-5 border-b space-y-3 ${
                  isDraft ? 'bg-amber-50/40 border-amber-200/60' : 'bg-slate-50/50 border-slate-100'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Team Number Badge */}
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-blue-100 text-blue-950 border border-blue-200 flex items-center gap-1">
                          <Hash className="w-3 h-3 text-blue-700" />
                          {team.teamNumber || 'Team --'}
                        </span>

                        {/* 6-digit Code Number */}
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1" title="6-Digit Institutional Code">
                          <span>Code:</span>
                          <strong className="text-blue-900">{team.codeNumber || '927624'}</strong>
                        </span>

                        {/* Status Badge */}
                        {isDraft ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> Draft (Private)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Finalised
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold font-serif text-slate-900 mt-2">
                        {team.teamName}
                      </h3>
                      <div className="text-xs text-teal-800 font-semibold mt-0.5">
                        Domain: {team.projectDomain}
                      </div>
                    </div>

                    {/* Member Count Pill */}
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-700 font-mono">
                        {currentCount} / {targetSize}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Members</span>
                    </div>
                  </div>

                  {/* Creator Attribution Info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                      Created by: <strong className="text-slate-800">{team.createdBy}</strong> ({team.creatorRole || 'Staff'})
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(team.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Member Roster List */}
                <div className="p-4 sm:p-5 space-y-2.5 flex-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Assigned Squad Members:</span>
                    {team.targetCompetition && (
                      <span className="text-[10px] font-semibold text-slate-500 font-normal">
                        Target: {team.targetCompetition}
                      </span>
                    )}
                  </div>

                  {team.members.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No members assigned yet. Click "Edit Team" to add students.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {team.members.map(member => (
                        <div 
                          key={member.studentId}
                          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-1 hover:bg-white hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 truncate max-w-[150px]">
                              {member.name}
                            </span>
                            {member.isLeader && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5 text-amber-600" /> Leader
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-blue-900">
                            {member.registerNumber}
                          </div>
                          <div className="text-[10px] font-semibold text-teal-700 truncate">
                            {member.assignedRole}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {team.notes && (
                    <div className="text-[11px] text-slate-500 bg-slate-100/60 p-2 rounded-lg border border-slate-200 mt-2">
                      <strong>Notes:</strong> {team.notes}
                    </div>
                  )}
                </div>

                {/* Team Card Actions */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Quick Finalise Button if Draft */}
                    {isDraft && (isCreator || isAdmin) && (
                      <button
                        type="button"
                        onClick={() => handleQuickFinalise(team)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-2xs cursor-pointer"
                        title="Finalise and publish to all staff and admin"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm & Finalise</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    {/* Edit Team Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(team)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                      title="Edit team details, number, 6-digit code, and members"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-800" />
                      <span>Edit Details</span>
                    </button>

                    {/* Delete Team Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(team)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete this squad"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TEAM CREATION & EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-5 shrink-0 relative">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-800 text-teal-300 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-white">
                    {editingTeamId ? 'Edit Team Details & Roster' : 'Create New Project Team'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Configure team number, 6-digit code (<span className="font-mono text-teal-300">927624</span>), target size, and assign members.
                  </p>
                </div>
              </div>
            </div>

            {/* Feedback Alert */}
            {feedback && (
              <div className={`px-5 py-3 text-xs font-semibold flex items-center gap-2 ${
                feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'
              }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
              
              {/* Basic Team Info */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-serif border-b border-slate-100 pb-2">
                  1. Team Identifiers & Dimensions
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Team Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Smart Hydrology Pioneers"
                      value={formTeamName}
                      onChange={e => setFormTeamName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Team Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Team Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Team 01, Squad 04"
                      value={formTeamNumber}
                      onChange={e => setFormTeamNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* 6-Digit Institutional Code Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>6-Digit Code Number *</span>
                      <span className="text-[10px] text-teal-700 font-mono font-semibold">Institutional</span>
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="e.g. 927624"
                      value={formCodeNumber}
                      onChange={e => setFormCodeNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold text-blue-950 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Target Team Size */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Team Size (Capacity) *
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={formTargetSize}
                      onChange={e => setFormTargetSize(parseInt(e.target.value, 10) || 5)}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Target Competition */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target Competition
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SIH 2026, Symposium"
                      value={formTargetCompetition}
                      onChange={e => setFormTargetCompetition(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900"
                    />
                  </div>
                </div>

                {/* Domain Focus */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project Domain / Problem Statement Focus:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Structural Health Monitoring, GIS & Remote Sensing, Green Concrete"
                    value={formDomain}
                    onChange={e => setFormDomain(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Members Selection & Search */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-serif">
                    2. Add Student Members ({formMembers.length} / {formTargetSize})
                  </h4>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    formMembers.length === formTargetSize 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : formMembers.length > formTargetSize 
                      ? 'bg-rose-100 text-rose-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {formMembers.length === formTargetSize ? 'Capacity Reached' : `${formTargetSize - formMembers.length} slots left`}
                  </span>
                </div>

                {/* Student Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search candidate by Roll No, Register No (e.g. 9276...), or Name to add..."
                    value={memberSearchQuery}
                    onChange={e => setMemberSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Dropdown Candidate Matches */}
                  {searchedCandidates.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {searchedCandidates.map(candidate => (
                        <div
                          key={candidate.id}
                          className="p-2.5 flex items-center justify-between hover:bg-blue-50/60 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-slate-900">{candidate.name}</div>
                            <div className="text-[11px] font-mono text-slate-500">
                              {candidate.registerNumber} • {candidate.department} ({candidate.academicYear})
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddMember(candidate)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-lg shadow-2xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Members List */}
                {formMembers.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                    No members added yet. Search by roll number or name above to build the squad.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {formMembers.map((member, idx) => (
                      <div 
                        key={member.studentId}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{member.name}</span>
                              {member.isLeader && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5 text-amber-600" /> Leader
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              {member.registerNumber} • {member.department}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pl-9 sm:pl-0">
                          {/* Role Selection */}
                          <select
                            value={member.assignedRole}
                            onChange={e => handleSetMemberRole(member.studentId, e.target.value)}
                            className="px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-900"
                          >
                            {AVAILABLE_ROLES.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>

                          {/* Leader Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleSetLeader(member.studentId)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              member.isLeader
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-white text-slate-400 border-slate-200 hover:text-amber-700'
                            }`}
                            title="Make Team Leader"
                          >
                            <Crown className="w-3.5 h-3.5" />
                          </button>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.studentId)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove from team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional Notes */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Internal Administrative Notes / Objectives:
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional internal remarks for faculty mentors or evaluation jury..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900"
                />
              </div>
            </div>

            {/* Modal Footer (Save as Draft vs Confirm & Finalise) */}
            <div className="bg-white border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500">
                Created by: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.role})
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="w-1/3 sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {/* SAVE AS DRAFT BUTTON */}
                <button
                  type="button"
                  onClick={() => handleSaveTeam('Draft')}
                  disabled={isSaving}
                  className="w-1/3 sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Save privately in your dashboard only. Other staff and students will not see it."
                >
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Save as Draft</span>
                </button>

                {/* CONFIRM & FINALISE BUTTON */}
                <button
                  type="button"
                  onClick={() => handleSaveTeam('Finalised')}
                  disabled={isSaving}
                  className="w-1/3 sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  title="Confirm and publish to all staff, admin, and faculty dashboards."
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-300" />
                  <span>Confirm & Finalise</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
