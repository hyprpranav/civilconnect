import React, { useState } from 'react';
import { StudentProfile, Announcement, UserAccount } from '../../types';
import { 
  User, 
  FileText, 
  Bell, 
  Users, 
  Sparkles, 
  Award, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Building2, 
  Calendar, 
  Lock, 
  ArrowRight,
  Layers,
  Phone,
  Mail,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { MyProfileTab } from './MyProfileTab';
import { ProfessionalProfileForm } from './ProfessionalProfileForm';
import { StudentUpdatesTab } from './StudentUpdatesTab';
import { StudentTeamsTab } from './StudentTeamsTab';
import { getGradeBadgeColor } from '../common/InterviewEvaluationModal';

interface StudentDashboardProps {
  user: UserAccount;
  student: StudentProfile;
  announcements: Announcement[];
  onProfileUpdated: (updated: StudentProfile) => void;
  externalTab?: string;
  onTabChange?: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  student,
  announcements,
  onProfileUpdated,
  externalTab,
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'form' | 'updates' | 'teams' | 'profile'>('dashboard');

  React.useEffect(() => {
    if (externalTab) {
      if (['dashboard', 'profile', 'form', 'updates', 'teams'].includes(externalTab)) {
        setActiveTab(externalTab as any);
      }
    }
  }, [externalTab]);

  const handleTabChange = (tab: 'dashboard' | 'form' | 'updates' | 'teams' | 'profile') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Section completion evaluation
  const hasSkills = Boolean(student.skills?.strongestSkills && student.skills.strongestSkills.length > 0);
  const hasInterests = Boolean(student.interests?.activities && student.interests.activities.length > 0);
  const hasRoles = Boolean(student.teamStrengths?.roles && student.teamStrengths.roles.length > 0);
  const hasPreferences = Boolean(student.teamPreferences?.preferredRole);

  const latestNotice = announcements.find(a => a.isActive && a.isImportant) || announcements[0];

  return (
    <div className="space-y-6">
      {/* TAB 1: STUDENT DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Greeting Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              {/* Identity Info */}
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-blue-50 border-2 border-blue-200 shrink-0 flex items-center justify-center text-blue-900 shadow-2xs">
                  {student.profileImage ? (
                    <img
                      src={student.profileImage}
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-blue-400" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950 font-serif">
                      Hello, {student.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-50 text-blue-900 border border-blue-200">
                      {student.registerNumber}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-500 pt-0.5">
                    <span className="font-semibold text-slate-800">{student.department}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-800">{student.academicYear}</span>
                    <span>•</span>
                    <span className="text-teal-700 font-semibold">{student.club || 'Engineering Club'}</span>
                  </div>

                  <p className="text-xs text-slate-600 max-w-xl pt-1">
                    {student.shortBio || 'Welcome to your Civil Connect Student Workspace. Complete your 4-stage talent dossier to qualify for hackathons, project cohorts, and industry competitions.'}
                  </p>
                </div>
              </div>

              {/* Profile Completion Dial Bar */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 w-full md:w-72 space-y-2 shrink-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                    Profile Completion
                  </span>
                  <span className="font-extrabold text-blue-900 text-sm">
                    {student.profileCompletionPercentage}%
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      student.profileCompletionPercentage === 100
                        ? 'bg-emerald-600'
                        : student.profileCompletionPercentage >= 60
                        ? 'bg-blue-700'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${student.profileCompletionPercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Status: <strong className="text-slate-800 uppercase font-semibold">{student.profileStatus}</strong></span>
                  {student.profileCompletionPercentage < 100 ? (
                    <button
                      onClick={() => handleTabChange('form')}
                      className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                    >
                      Complete Profile
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* OFFICIAL 1-TO-1 INTERVIEW SCORECARD (Published by Admin) */}
          {student.interviewEvaluation && student.interviewEvaluation.isPublishedToStudent && (
            <div className="bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 rounded-2xl border-2 border-indigo-200/80 p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Official Faculty Assessment Published
                    </div>
                    <h2 className="text-lg font-bold font-serif text-slate-900">
                      1-to-1 Interview & Performance Scorecard
                    </h2>
                    <p className="text-xs text-slate-500">
                      Evaluated by <strong className="text-slate-700">{student.interviewEvaluation.evaluatedByName}</strong> ({student.interviewEvaluation.evaluatorRole}) on {new Date(student.interviewEvaluation.evaluatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="bg-white/90 border border-indigo-200 rounded-2xl p-3 px-5 text-right flex items-center sm:flex-col justify-between sm:justify-center shadow-2xs shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overall Score</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black text-indigo-950 font-mono">
                      {student.interviewEvaluation.totalMarks}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">/ {student.interviewEvaluation.maxTotalMarks || 100}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border mt-1 ${getGradeBadgeColor(student.interviewEvaluation.grade)}`}>
                    Grade: {student.interviewEvaluation.grade}
                  </span>
                </div>
              </div>

              {/* 6 Competencies Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-serif">
                  Competency Assessment Breakdown
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {student.interviewEvaluation.criteria.map((c, i) => {
                    const ratio = Math.round((c.awardedMarks / c.maxMarks) * 100);
                    return (
                      <div key={c.id || i} className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 line-clamp-1">{c.name}</span>
                          <span className="font-mono font-bold text-indigo-900 shrink-0">
                            {c.awardedMarks} / {c.maxMarks}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              ratio >= 80 ? 'bg-emerald-500' : ratio >= 60 ? 'bg-blue-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                        {c.remarks && (
                          <p className="text-[10px] text-slate-500 italic line-clamp-1">
                            Note: {c.remarks}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommendations & Feedback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {student.interviewEvaluation.recommendedRole && (
                  <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider">Recommended Project Squad Role</span>
                    <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      {student.interviewEvaluation.recommendedRole}
                    </div>
                  </div>
                )}

                {student.interviewEvaluation.strengths && (
                  <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Identified Key Strengths</span>
                    <div className="font-semibold text-emerald-950">
                      {student.interviewEvaluation.strengths}
                    </div>
                  </div>
                )}
              </div>

              {student.interviewEvaluation.generalFeedback && (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Faculty Feedback & Remarks</span>
                  <p className="text-slate-700 leading-relaxed">
                    {student.interviewEvaluation.generalFeedback}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Section 1: Qualifications & Assessment Progress ("what was he doing does he filled those details") */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-blue-950 font-serif flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-800" />
                  Qualifications & Dossier Progress
                </h2>
                <p className="text-xs text-slate-500">
                  Track whether you have filled each section required for inter-collegiate squads and competition cohorts.
                </p>
              </div>

              <button
                onClick={() => handleTabChange('form')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
              >
                <span>{student.profileCompletionPercentage === 100 ? 'Review Assessment' : 'Complete Assessment'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Step 1: Core Skills */}
              <div 
                onClick={() => handleTabChange('form')}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-xs ${
                  hasSkills ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Step 1 • 25%</span>
                  {hasSkills ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Filled
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> Pending
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Core Skills</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {hasSkills 
                    ? `${student.skills!.strongestSkills.length} skills recorded (${student.skills!.strongestSkills.slice(0, 2).join(', ')}${student.skills!.strongestSkills.length > 2 ? '...' : ''})`
                    : 'Click to add your personal & engineering strengths.'}
                </p>
              </div>

              {/* Step 2: Activities & Focus */}
              <div 
                onClick={() => handleTabChange('form')}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-xs ${
                  hasInterests ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Step 2 • 25%</span>
                  {hasInterests ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Filled
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> Pending
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Activities & Focus</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {hasInterests 
                    ? `${student.interests!.activities.length} activities chosen for competitions`
                    : 'Click to select hackathons & project schemes.'}
                </p>
              </div>

              {/* Step 3: Team Roles & Logistics */}
              <div 
                onClick={() => handleTabChange('form')}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-xs ${
                  hasRoles ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Step 3 • 25%</span>
                  {hasRoles ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Filled
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> Pending
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Team Roles</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {hasRoles 
                    ? `${student.teamStrengths!.roles.length} roles documented for project squads`
                    : 'Click to specify team roles & operational readiness.'}
                </p>
              </div>

              {/* Step 4: Team Preferences */}
              <div 
                onClick={() => handleTabChange('form')}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-xs ${
                  hasPreferences ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Step 4 • 25%</span>
                  {hasPreferences ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Filled
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> Pending
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Formation Preferences</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {hasPreferences 
                    ? `Role: ${student.teamPreferences!.preferredRole} • Domain: ${student.teamPreferences!.preferredTechnicalDomain || 'Civil Eng'}`
                    : 'Click to choose your domain & team size preferences.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Official Academic & Registration Record */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-blue-950 font-serif flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-900" />
                Official Academic & Registration Record
              </h2>
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                <Lock className="w-3.5 h-3.5 text-slate-500" /> Read-Only Verified Data
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Full Name</span>
                <p className="font-bold text-slate-900 text-sm">{student.name}</p>
              </div>

              <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Official Register Number</span>
                <p className="font-mono font-bold text-blue-950 text-sm">{student.registerNumber}</p>
              </div>

              <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Official College Email ID</span>
                <p className="font-semibold text-slate-900 break-all">{student.email}</p>
              </div>

              <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Department</span>
                <p className="font-bold text-slate-900">{student.department}</p>
              </div>

              <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Academic Year</span>
                <p className="font-bold text-slate-900">{student.academicYear}</p>
              </div>

              <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Assigned Club / Association</span>
                <p className="font-bold text-slate-900">{student.club || 'Engineering Club'}</p>
              </div>

              <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Date of Birth (DOB)</span>
                <p className="font-mono font-bold text-slate-900">
                  {student.dob ? new Date(student.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified (edit in My Profile)'}
                </p>
              </div>

              <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Japanese Language Track</span>
                <p className="font-bold text-blue-900">{student.japaneseStudent || 'No'}</p>
              </div>

              <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">AWS Cloud Track Interest</span>
                <p className="font-bold text-blue-900">{student.awsInterested || 'No'}</p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span>Confirmation ID: <strong className="font-mono text-slate-700">{student.confirmationId}</strong> • Registered: {student.registrationDate}</span>
              <button
                onClick={() => handleTabChange('profile')}
                className="font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Edit Personal Details & Profile Photo in My Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Latest Department Announcement (if any) */}
          {latestNotice && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Latest Department Notice</span>
                  <h4 className="text-xs font-bold text-slate-900">{latestNotice.title}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-1">{latestNotice.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleTabChange('updates')}
                className="px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                View Notice
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SKILLS ASSESSMENT */}
      {activeTab === 'form' && (
        <ProfessionalProfileForm
          student={student}
          onProfileSubmitted={onProfileUpdated}
        />
      )}

      {/* TAB 3: TEAM & COHORT */}
      {activeTab === 'teams' && (
        <StudentTeamsTab
          currentStudent={student}
        />
      )}

      {/* TAB 4: ANNOUNCEMENTS & UPDATES */}
      {activeTab === 'updates' && (
        <StudentUpdatesTab
          announcements={announcements}
        />
      )}

      {/* TAB 5: MY PROFILE (LAST NAV SECTION) */}
      {activeTab === 'profile' && (
        <MyProfileTab
          student={student}
          onProfileUpdated={onProfileUpdated}
        />
      )}
    </div>
  );
};
