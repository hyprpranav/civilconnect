import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Sparkles, 
  Compass, 
  Award, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  HelpCircle,
  Lightbulb,
  Building2,
  Hash,
  Eye,
  Crown,
  Star,
  Layers,
  UserPlus,
  Plus,
  Send,
  AlertCircle
} from 'lucide-react';
import { teamService, SkillCategoryBreakdown } from '../../services/teamService';
import { storageService } from '../../services/storageService';
import { TeamFormation, StudentProfile, TeamProposalRequest } from '../../types';
import { TeamDetailsModal } from '../common/TeamDetailsModal';
import { CreateTeamProposalModal } from './CreateTeamProposalModal';

interface StudentTeamsTabProps {
  currentStudent: StudentProfile;
}

export const StudentTeamsTab: React.FC<StudentTeamsTabProps> = ({ currentStudent }) => {
  const [skillStats, setSkillStats] = useState<SkillCategoryBreakdown | null>(null);
  const [teams, setTeams] = useState<TeamFormation[]>([]);
  const [teamProposals, setTeamProposals] = useState<TeamProposalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamForView, setSelectedTeamForView] = useState<TeamFormation | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const stats = await teamService.getCohortSkillAnalytics();
        setSkillStats(stats);
        const allTeams = await storageService.getTeams();
        // Students can only see confirmed and finalised teams, never drafts
        const publicTeams = allTeams.filter(t => t.status !== 'Draft');
        setTeams(publicTeams);
      } catch (err) {
        console.error('Failed to load team analytics', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Real-time listener for student's submitted team proposals
    const sId = (currentStudent.id || '').toLowerCase().trim();
    const sReg = (currentStudent.registerNumber || '').toLowerCase().trim();

    const unsub = storageService.subscribeToTeamRequests(requests => {
      const myProposals = requests.filter(r => 
        (r.submittedByStudentId && r.submittedByStudentId.toLowerCase() === sId) ||
        (r.submittedByStudentRegNo && r.submittedByStudentRegNo.toLowerCase() === sReg) ||
        r.members.some(m => 
          (m.studentId && m.studentId.toLowerCase() === sId) ||
          (m.registerNumber && m.registerNumber.toLowerCase() === sReg)
        )
      );
      setTeamProposals(myProposals);
    });

    return () => unsub();
  }, [currentStudent]);

  const studentRegNormalized = (currentStudent.registerNumber || '').toLowerCase().trim();
  const studentIdNormalized = (currentStudent.id || '').toLowerCase().trim();

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-800/60 text-teal-300 border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Department Team Hub
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif">
            Department Project Squads & Skill Analytics
          </h2>
          <p className="text-xs text-blue-200 leading-relaxed">
            Form competition teams with your peers, assign specialized roles, or browse confirmed department project squads.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsProposalModalOpen(true)}
          className="relative z-10 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer shrink-0 self-start sm:self-center"
        >
          <UserPlus className="w-4 h-4 text-slate-950" />
          <span>Create Your Team & Submit Request</span>
        </button>
      </div>

      {/* MY SUBMITTED TEAM PROPOSALS SECTION */}
      {teamProposals.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-900 flex items-center justify-center font-bold">
                <Send className="w-4 h-4 text-teal-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  My Team Formation Proposals ({teamProposals.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Track the approval status of your student-submitted project squads.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsProposalModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
            >
              + Propose Another Team
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {teamProposals.map(req => {
              return (
                <div 
                  key={req.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    req.status === 'Approved'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : req.status === 'Rejected'
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-amber-50/40 border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm font-serif">
                          {req.teamName}
                        </span>
                        {req.resultingTeamCode && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-teal-600 text-white">
                            {req.resultingTeamCode}
                          </span>
                        )}
                        {req.status === 'Pending' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending Faculty Review
                          </span>
                        )}
                        {req.status === 'Approved' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved & Confirmed
                          </span>
                        )}
                        {req.status === 'Rejected' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-600" /> Rejected
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Domain: <strong className="text-slate-800">{req.projectDomain}</strong> • For: <strong className="text-slate-800">{req.targetCompetition}</strong>
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(req.submissionDate).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Members list */}
                  <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Proposed Roster ({req.members.length} Members)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {req.members.map(m => (
                        <span 
                          key={m.studentId}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200"
                        >
                          {m.isLeader && <Crown className="w-2.5 h-2.5 text-amber-600" />}
                          <strong className="text-slate-900">{m.name}</strong>
                          <span className="text-[9px] text-blue-600">({m.assignedRole})</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {req.notes && (
                    <p className="text-[11px] text-slate-600 italic">
                      "{req.notes}"
                    </p>
                  )}

                  {req.rejectionReason && req.status === 'Rejected' && (
                    <div className="p-2 bg-rose-100/70 border border-rose-200 rounded-lg text-[11px] text-rose-900">
                      <strong>Faculty Feedback:</strong> {req.rejectionReason}
                    </div>
                  )}

                  {req.reviewedBy && (
                    <div className="text-[10px] text-slate-400">
                      Reviewed by {req.reviewedBy} on {new Date(req.reviewedAt || req.submissionDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ALL FORMED TEAMS GRID (VISIBLE TO ALL STUDENTS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-700" />
              Published Department Squads ({teams.length})
            </h3>
            <p className="text-xs text-slate-500">
              Browse formed project teams. If you are enrolled in a team, your squad card will highlight your active assignment.
            </p>
          </div>
        </div>

        {teams.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 font-serif">No Teams Formed Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Department project teams are currently being formulated by faculty mentors. Once finalised, squad rosters will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map(team => {
              // Check if current student is a member of this team
              const currentMemberInfo = team.members.find(m => {
                const mReg = (m.registerNumber || '').toLowerCase().trim();
                const mId = (m.studentId || '').toLowerCase().trim();
                return (
                  mReg === studentRegNormalized ||
                  mId === studentIdNormalized ||
                  mReg === studentIdNormalized ||
                  mId === studentRegNormalized
                );
              });

              const isCurrentStudentInTeam = !!currentMemberInfo;

              return (
                <div
                  key={team.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden relative ${
                    isCurrentStudentInTeam
                      ? 'border-emerald-300 ring-2 ring-emerald-400/30 shadow-xs'
                      : 'border-slate-200 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  {/* PERSONAL MEMBERSHIP BANNER (IF IN TEAM) */}
                  {isCurrentStudentInTeam && (
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shrink-0">
                      <span className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300 animate-pulse" />
                        <span>You are in this Team!</span>
                      </span>
                      {currentMemberInfo.isLeader && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-300 text-amber-950 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-900" /> Leader
                        </span>
                      )}
                    </div>
                  )}

                  {/* CARD HEADER */}
                  <div className={`p-4 sm:p-5 space-y-3 flex-1 ${
                    isCurrentStudentInTeam ? 'bg-emerald-50/30' : 'bg-slate-50/40'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Team Code Badge */}
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-teal-50 text-teal-900 border border-teal-300 flex items-center gap-1">
                          <Hash className="w-3 h-3 text-teal-700" />
                          <strong>{team.teamCode || team.teamNumber || 'TM-001'}</strong>
                        </span>

                        {/* Team Number (if different from code) */}
                        {team.teamNumber && team.teamNumber !== team.teamCode && (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-semibold bg-blue-50 text-blue-900 border border-blue-200">
                            {team.teamNumber}
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Finalised
                        </span>
                      </div>

                      {/* Member Count */}
                      <span className="text-[11px] font-mono font-bold text-slate-600 shrink-0 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {team.members.length} / {team.targetSize || 5} Mbrs
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold font-serif text-slate-900">
                        {team.teamName}
                      </h4>
                      <p className="text-xs text-teal-800 font-semibold mt-0.5">
                        Domain: {team.projectDomain}
                      </p>
                    </div>

                    {/* Assigned Role Pill if current student is in team */}
                    {isCurrentStudentInTeam && (
                      <div className="bg-emerald-100/70 border border-emerald-300/70 rounded-xl p-2.5 text-xs text-emerald-950">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">Your Assigned Role:</span>
                        <div className="font-bold flex items-center gap-1.5 mt-0.5">
                          <span>{currentMemberInfo.assignedRole}</span>
                        </div>
                      </div>
                    )}

                    {/* Target Competition */}
                    {team.targetCompetition && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{team.targetCompetition}</span>
                      </div>
                    )}
                  </div>

                  {/* CARD FOOTER WITH VIEW DETAILS BUTTON */}
                  <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {team.members.length} members
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedTeamForView(team)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:text-white bg-blue-50 hover:bg-blue-900 border border-blue-200 hover:border-blue-900 rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TEAM DETAILS READ-ONLY MODAL FOR STUDENT */}
      <TeamDetailsModal
        team={selectedTeamForView}
        isOpen={!!selectedTeamForView}
        onClose={() => setSelectedTeamForView(null)}
        currentStudentId={currentStudent.id}
        userRole="STUDENT"
      />

      {/* Cohort Skill Aggregations (Privacy Preserving) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-700" />
            Cohort Skill Distribution & Operational Strengths (Civil Engineering)
          </h3>
          <p className="text-xs text-slate-500">
            Aggregated metrics across all registered students in the active academic cohort.
          </p>
        </div>

        {skillStats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Leadership</span>
              <p className="text-2xl font-extrabold text-blue-900">{skillStats.leadershipCount}</p>
              <p className="text-[11px] text-slate-500">Candidates willing to lead</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hardware / Tech</span>
              <p className="text-2xl font-extrabold text-teal-800">{skillStats.hardwareCount}</p>
              <p className="text-[11px] text-slate-500">Hardware & Survey specialists</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Software & BIM</span>
              <p className="text-2xl font-extrabold text-indigo-800">{skillStats.softwareCount}</p>
              <p className="text-[11px] text-slate-500">Coding, BIM & CAD developers</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Logistics & Budget</span>
              <p className="text-2xl font-extrabold text-purple-800">{skillStats.logisticsCount}</p>
              <p className="text-[11px] text-slate-500">Operations & travel leads</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Research & Analysis</span>
              <p className="text-2xl font-extrabold text-slate-800">{skillStats.researchCount}</p>
              <p className="text-[11px] text-slate-500">MSME & Paper authors</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pitch & Presentation</span>
              <p className="text-2xl font-extrabold text-amber-800">{skillStats.presentationCount}</p>
              <p className="text-[11px] text-slate-500">Public speakers & pitch leads</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Documentation</span>
              <p className="text-2xl font-extrabold text-emerald-800">{skillStats.documentationCount}</p>
              <p className="text-[11px] text-slate-500">Technical report specialists</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Event Management</span>
              <p className="text-2xl font-extrabold text-blue-950">{skillStats.eventManagementCount}</p>
              <p className="text-[11px] text-slate-500">Coordinators & hosts</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs">Loading analytics...</div>
        )}
      </div>

      {/* Target Competitions & Upcoming Opportunities */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600" />
          Active Team Opportunities & Open Calls
        </h3>

        <div className="space-y-3">
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900">
                  National Hackathon
                </span>
                <span className="text-xs font-bold text-slate-900">Smart India Hackathon 2026 - Civil Tracks</span>
              </div>
              <p className="text-xs text-slate-600">
                Forming 4 multidisciplinary teams (6 members each) for disaster mitigation, smart traffic sensors, and structural health monitoring.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-900 rounded-lg shrink-0">
              Selection in Progress
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-900">
                  MSME Grant
                </span>
                <span className="text-xs font-bold text-slate-900">Eco-Concrete & Waste Upcycling Student Startup Incubator</span>
              </div>
              <p className="text-xs text-slate-600">
                Open for students interested in sustainable materials, product development, patenting, and government funding schemes.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-teal-50 text-teal-900 rounded-lg shrink-0">
              Applications Open
            </span>
          </div>
        </div>
      </div>

      {/* Create Team Proposal Modal */}
      <CreateTeamProposalModal
        currentStudent={currentStudent}
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        onSubmitted={() => {
          // Handled via real-time subscription
        }}
      />

      {/* Team Details Modal */}
      {selectedTeamForView && (
        <TeamDetailsModal
          team={selectedTeamForView}
          isOpen={Boolean(selectedTeamForView)}
          onClose={() => setSelectedTeamForView(null)}
        />
      )}
    </div>
  );
};
