import React from 'react';
import { 
  X, 
  Layers, 
  Users, 
  CheckCircle2, 
  Clock, 
  Crown, 
  UserCheck, 
  Calendar, 
  Sparkles, 
  Building2, 
  Hash, 
  Award,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { TeamFormation, StudentProfile, UserRole } from '../../types';

interface TeamDetailsModalProps {
  team: TeamFormation | null;
  isOpen: boolean;
  onClose: () => void;
  currentStudentId?: string;
  userRole?: UserRole;
}

export const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({
  team,
  isOpen,
  onClose,
  currentStudentId,
  userRole
}) => {
  if (!isOpen || !team) return null;

  const isMember = currentStudentId && team.members.some(
    m => m.studentId.toLowerCase() === currentStudentId.toLowerCase() ||
         m.registerNumber.toLowerCase() === currentStudentId.toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-2 pr-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-teal-400 text-slate-950 shadow-xs flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" />
                {team.teamCode || team.teamNumber || 'TM-001'}
              </span>

              {team.teamNumber && team.teamNumber !== team.teamCode && (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white/15 text-slate-200">
                  {team.teamNumber}
                </span>
              )}

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                team.status === 'Draft' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
              }`}>
                {team.status}
              </span>
            </div>

            <h3 className="text-xl font-bold font-serif text-white tracking-wide">
              {team.teamName}
            </h3>

            <div className="text-xs text-teal-300 font-semibold">
              Project Domain: <span className="text-white font-medium">{team.projectDomain}</span>
            </div>
          </div>
        </div>

        {/* MEMBER HIGHLIGHT BANNER (If logged in student is in this team) */}
        {isMember && (
          <div className="bg-emerald-50 px-5 py-2.5 border-b border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>You are a registered member of this Project Squad!</span>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
          
          {/* Metadata Grid */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Target Competition</span>
              <p className="font-semibold text-slate-900 mt-0.5">
                {team.targetCompetition || 'Smart India Hackathon / Technical Symposium'}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Squad Capacity</span>
              <p className="font-semibold text-slate-900 mt-0.5">
                {team.members.length} / {team.targetSize || 5} Members Assigned
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Created By</span>
              <p className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                {team.createdBy} ({team.creatorRole || 'Faculty'})
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Formation Date</span>
              <p className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(team.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* SQUAD MEMBERS ROSTER */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-serif flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-700" />
                Assigned Squad Members ({team.members.length})
              </h4>
            </div>

            {team.members.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No members assigned to this squad yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {team.members.map((member, i) => {
                  const isCurrent = currentStudentId && (
                    member.studentId.toLowerCase() === currentStudentId.toLowerCase() ||
                    member.registerNumber.toLowerCase() === currentStudentId.toLowerCase()
                  );

                  return (
                    <div 
                      key={member.studentId || i}
                      className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl px-2 transition-colors ${
                        isCurrent ? 'bg-emerald-50/70 border border-emerald-200 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-900 text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{member.name}</span>
                            {member.isLeader && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5 text-amber-600" /> Team Leader
                              </span>
                            )}
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {member.registerNumber} • {member.department}
                          </div>
                        </div>
                      </div>

                      <div className="pl-10 sm:pl-0">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {member.assignedRole}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {team.notes && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Internal Objectives & Guidance</span>
              <p className="text-slate-700 leading-relaxed">{team.notes}</p>
            </div>
          )}

          {/* Student Notice */}
          <div className="text-[11px] text-slate-400 italic text-center">
            {userRole === 'STUDENT'
              ? 'Institutional Team Roster • Contact department faculty coordinators for squad queries.'
              : 'Authorized Faculty & Administrative Team View.'}
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
