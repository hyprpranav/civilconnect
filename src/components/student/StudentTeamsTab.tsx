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
  Building2
} from 'lucide-react';
import { teamService, SkillCategoryBreakdown } from '../../services/teamService';
import { storageService } from '../../services/storageService';
import { TeamFormation, StudentProfile } from '../../types';

interface StudentTeamsTabProps {
  currentStudent: StudentProfile;
}

export const StudentTeamsTab: React.FC<StudentTeamsTabProps> = ({ currentStudent }) => {
  const [skillStats, setSkillStats] = useState<SkillCategoryBreakdown | null>(null);
  const [teams, setTeams] = useState<TeamFormation[]>([]);
  const [myTeam, setMyTeam] = useState<TeamFormation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const stats = await teamService.getCohortSkillAnalytics();
        setSkillStats(stats);
        const allTeams = await storageService.getTeams();
        // Students can only see confirmed and finalised teams, never drafts
        const publicTeams = allTeams.filter(t => t.status !== 'Draft');
        setTeams(publicTeams);

        const assigned = publicTeams.find(t => 
          t.members.some(m => m.studentId.toLowerCase() === currentStudent.id.toLowerCase())
        );
        setMyTeam(assigned || null);
      } catch (err) {
        console.error('Failed to load team analytics', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentStudent]);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-800/60 text-teal-300 border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Department Team Hub
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif">
            Student Skill Distribution & Team Opportunities
          </h2>
          <p className="text-xs text-blue-200 leading-relaxed">
            CIVIL CONNECT algorithms map interdisciplinary teams pairing leaders, technical engineers, and operational coordinators. Private personal details remain strictly protected.
          </p>
        </div>
      </div>

      {/* Student Assigned Team Card (if any) */}
      {myTeam ? (
        <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Confirmed Team Assignment
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-200 text-emerald-950">
              {myTeam.status}
            </span>
          </div>

          <h3 className="text-lg font-bold text-emerald-950 font-serif">
            Team: {myTeam.teamName}
          </h3>
          <p className="text-xs text-emerald-800">
            Project Domain: <span className="font-semibold">{myTeam.projectDomain}</span>
          </p>

          <div className="pt-2 border-t border-emerald-200/60">
            <h4 className="text-xs font-bold text-emerald-900 mb-2">Team Members:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {myTeam.members.map(m => (
                <div key={m.studentId} className="bg-white/80 p-2.5 rounded-xl border border-emerald-200 text-xs">
                  <div className="font-bold text-slate-900">{m.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{m.registerNumber} • {m.department}</div>
                  <div className="text-[10px] font-semibold text-emerald-700 mt-1">
                    Role: {m.assignedRole} {m.isLeader && '👑 (Leader)'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-slate-900">Current Team Formation Status: Pending Mapping</h3>
            <p className="text-xs text-slate-500 max-w-xl">
              You are currently in the active student matching pool. Once the faculty committee forms and verifies your project team, your team roster and competition assignments will be unlocked here.
            </p>
          </div>
          <span className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            Profile Status: {currentStudent.profileStatus}
          </span>
        </div>
      )}

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
    </div>
  );
};
