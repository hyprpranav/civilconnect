import React, { useState } from 'react';
import { StudentProfile, TeamFormation, Announcement } from '../../types';
import { 
  Download, 
  Users, 
  Calendar, 
  FileSpreadsheet, 
  Database, 
  CheckCircle2,
  Clock,
  Award,
  Hash,
  Sparkles,
  Layers
} from 'lucide-react';

interface ExportCenterViewProps {
  students: StudentProfile[];
  teams?: TeamFormation[];
  announcements?: Announcement[];
}

export const ExportCenterView: React.FC<ExportCenterViewProps> = ({
  students,
  teams = [],
  announcements = []
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const triggerDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(`Downloaded ${filename} successfully!`);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const formatDateTime = (isoDate?: string | null) => {
    if (!isoDate) return 'Not Submitted Yet';
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return isoDate;
      return d.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'medium'
      });
    } catch {
      return isoDate;
    }
  };

  // Helper to find assigned team code for student
  const getAssignedTeamInfo = (student: StudentProfile) => {
    const assignedTeam = teams.find(t =>
      t.members.some(m => {
        const mId = (m.studentId || '').toLowerCase().trim();
        const mReg = (m.registerNumber || '').toLowerCase().trim();
        const sId = (student.id || '').toLowerCase().trim();
        const sReg = (student.registerNumber || '').toLowerCase().trim();
        return mId === sId || mReg === sReg || mId === sReg || mReg === sId;
      })
    );
    if (!assignedTeam) return { teamCode: 'Unassigned', teamName: 'None' };
    return {
      teamCode: assignedTeam.teamCode || assignedTeam.teamNumber || 'TM001',
      teamName: assignedTeam.teamName
    };
  };

  // 1. Export Student Name + Register Number
  const exportNameRegNo = () => {
    const headers = 'Register Number,Name,Department,Academic Year,Team Code,Team Name\n';
    const rows = students.map(s => {
      const tm = getAssignedTeamInfo(s);
      return `"${s.registerNumber}","${s.name}","${s.department}","${s.academicYear}","${tm.teamCode}","${tm.teamName}"`;
    }).join('\n');
    triggerDownload(`civil_students_name_regno_${Date.now()}.csv`, headers + rows);
  };

  // 2. Export Name + Phone + Email
  const exportContactInfo = () => {
    const headers = 'Register Number,Name,Official Email,Phone Number,Department,Academic Year,Team Code\n';
    const rows = students.map(s => {
      const tm = getAssignedTeamInfo(s);
      return `"${s.registerNumber}","${s.name}","${s.email}","${s.phone || 'N/A'}","${s.department}","${s.academicYear}","${tm.teamCode}"`;
    }).join('\n');
    triggerDownload(`civil_students_contact_directory_${Date.now()}.csv`, headers + rows);
  };

  // 3. Full Student Data (CSV) with Exact Submission Timestamp & Team
  const exportFullStudentData = () => {
    const headers = 'Register Number,Name,Department,Academic Year,Official Email,Phone Number,Profile Status,Completion Percentage,Form Submission Date & Time,Assigned Team Code,Assigned Team Name,Skills,Interests,Preferred Role,Travel Willing,Leader Willing,Confirmation ID\n';
    const rows = students.map(s => {
      const tm = getAssignedTeamInfo(s);
      const skills = (s.skills?.strongestSkills || []).join('; ');
      const interests = (s.interests?.activities || []).join('; ');
      const role = s.teamPreferences?.preferredRole || '';
      const travel = s.teamPreferences?.willingnessToTravel ? 'Yes' : 'No';
      const lead = s.teamPreferences?.willingToLeadTeam ? 'Yes' : 'No';
      const submissionDate = formatDateTime(s.submittedAt || s.updatedAt);

      return `"${s.registerNumber}","${s.name}","${s.department}","${s.academicYear}","${s.email}","${s.phone || ''}","${s.profileStatus}",${s.profileCompletionPercentage}%,"${submissionDate}","${tm.teamCode}","${tm.teamName}","${skills}","${interests}","${role}","${travel}","${lead}","${s.confirmationId || ''}"`;
    }).join('\n');
    triggerDownload(`civil_connect_full_student_roster_${Date.now()}.csv`, headers + rows);
  };

  // 4. 1-to-1 Interview & Evaluation Assessment Report (CSV)
  // Contains all 6 criteria scores out of 100, grade, evaluator, and submission timestamp
  const exportInterviewEvaluationReport = () => {
    const headers = [
      'Register Number',
      'Student Name',
      'Department',
      'Academic Year',
      'Official Email',
      'Phone Number',
      'Interview Evaluation Status',
      'Technical Knowledge & Core (/20)',
      'Communication & Articulation (/20)',
      'Problem Solving & Analytical (/20)',
      'Project Experience & Hands-On (/15)',
      'Teamwork & Professionalism (/15)',
      'Domain Passion & Initiative (/10)',
      'Total Marks Obtained (/100)',
      'Percentage (%)',
      'Awarded Grade',
      'Faculty Evaluator Name',
      'Evaluation Timestamp',
      'Evaluator Remarks',
      'Student Questionnaire Submission Date & Time'
    ].join(',') + '\n';

    const rows = students.map(s => {
      const evalData = s.interviewEvaluation;
      const submissionTime = formatDateTime(s.submittedAt || s.updatedAt);

      if (evalData) {
        const c1 = evalData.criteria?.find(c => c.id === 'tech_knowledge')?.awardedMarks ?? 'N/A';
        const c2 = evalData.criteria?.find(c => c.id === 'communication')?.awardedMarks ?? 'N/A';
        const c3 = evalData.criteria?.find(c => c.id === 'problem_solving')?.awardedMarks ?? 'N/A';
        const c4 = evalData.criteria?.find(c => c.id === 'project_experience')?.awardedMarks ?? 'N/A';
        const c5 = evalData.criteria?.find(c => c.id === 'teamwork_attitude')?.awardedMarks ?? 'N/A';
        const c6 = evalData.criteria?.find(c => c.id === 'initiative_fit')?.awardedMarks ?? 'N/A';
        
        const evalTime = formatDateTime(evalData.evaluatedAt);
        const remarks = (evalData.generalFeedback || '').replace(/"/g, '""');

        return `"${s.registerNumber}","${s.name}","${s.department}","${s.academicYear}","${s.email}","${s.phone || ''}","Evaluated","${c1}/20","${c2}/20","${c3}/20","${c4}/15","${c5}/15","${c6}/10",${evalData.totalMarks},"${evalData.percentage}%","${evalData.grade}","${evalData.evaluatedByName || 'Faculty Officer'}","${evalTime}","${remarks}","${submissionTime}"`;
      } else {
        const pendingMsg = 'Evaluation Pending / Not Completed Yet';
        return `"${s.registerNumber}","${s.name}","${s.department}","${s.academicYear}","${s.email}","${s.phone || ''}","${pendingMsg}","${pendingMsg}","${pendingMsg}","${pendingMsg}","${pendingMsg}","${pendingMsg}","${pendingMsg}","${pendingMsg}","${pendingMsg}","${pendingMsg}","${pendingMsg}","${pendingMsg}","${pendingMsg}","${submissionTime}"`;
      }
    }).join('\n');

    triggerDownload(`civil_connect_interview_evaluations_report_${Date.now()}.csv`, headers + rows);
  };

  // 5. Team Summary Export
  const exportTeamMembers = () => {
    const headers = 'Team Code,Team Name,Project Domain,Status,Leader Name,Leader Register Number,Total Members\n';
    const rows = teams.map(t => {
      const leader = t.members.find(m => m.isLeader);
      const teamCode = t.teamCode || t.teamNumber || 'TM001';
      return `"${teamCode}","${t.teamName}","${t.projectDomain || 'General Civil'}","${t.status}","${leader?.name || 'Assigned'}","${leader?.registerNumber || ''}",${t.members.length}`;
    }).join('\n');
    triggerDownload(`civil_teams_roster_${Date.now()}.csv`, headers + rows);
  };

  // 6. Full Detailed Team Members Roster
  const exportFullTeamReports = () => {
    const headers = 'Team Code,Team Name,Project Domain,Status,Member Name,Register Number,Department,Assigned Role,Is Leader\n';
    const rows = teams.flatMap(t => {
      const teamCode = t.teamCode || t.teamNumber || 'TM001';
      return t.members.map(m => 
        `"${teamCode}","${t.teamName}","${t.projectDomain || 'General Civil'}","${t.status}","${m.name}","${m.registerNumber}","${m.department}","${m.assignedRole}","${m.isLeader ? 'Yes' : 'No'}"`
      );
    }).join('\n');
    triggerDownload(`civil_teams_detailed_report_${Date.now()}.csv`, headers + rows);
  };

  // 7. Events / Announcements Export
  const exportEvents = () => {
    const headers = 'Title,Category,Published By,Published At,Important\n';
    const rows = announcements.map(a => `"${a.title}","${a.category}","${a.publishedBy}","${a.publishedAt}","${a.isImportant ? 'Yes' : 'No'}"`).join('\n');
    triggerDownload(`civil_events_announcements_${Date.now()}.csv`, headers + rows);
  };

  // 8. Overall System Database (Full Master Extraction Dump)
  const exportMasterSystemDump = () => {
    const meta = `# CIVIL CONNECT - Master Extraction Dump\n# Exported At: ${new Date().toISOString()}\n# Total Active Students: ${students.length}\n# Total Active Teams: ${teams.length}\n\n`;
    const headers = 'Record Type,ID,Name,Department,Email,Details\n';
    const studentRows = students.map(s => {
      const evalStatus = s.interviewEvaluation ? `Grade ${s.interviewEvaluation.grade} (${s.interviewEvaluation.totalMarks}/100)` : 'No Evaluation';
      return `"Student","${s.registerNumber}","${s.name}","${s.department}","${s.email}","Completion: ${s.profileCompletionPercentage}% | ${evalStatus}"`;
    }).join('\n');
    const teamRows = teams.map(t => {
      const leader = t.members.find(m => m.isLeader);
      const teamCode = t.teamCode || t.teamNumber || 'TM001';
      return `"Team","${teamCode}","${t.teamName}","Civil Engineering","Leader: ${leader?.name || 'Assigned'} | Members: ${t.members.length}"`;
    }).join('\n');
    triggerDownload(`civil_connect_master_database_${Date.now()}.csv`, meta + headers + studentRows + '\n' + teamRows);
  };

  // Statistics for Evaluation Card
  const evaluatedCount = students.filter(s => !!s.interviewEvaluation).length;
  const pendingEvalCount = students.length - evaluatedCount;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans tracking-tight">
          Export Center
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Download sanitized student rosters, 1-to-1 interview evaluation sheets, team formations, and system reports in CSV format.
        </p>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Card 1: Student Rosters */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Student Rosters</h3>
                <p className="text-[11px] text-slate-400">Total {students.length} Enrolled</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={exportNameRegNo}
                disabled={students.length === 0}
                className="w-full py-2 px-3 border border-blue-600 text-blue-600 hover:bg-blue-50/50 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Name + Register Number</span>
              </button>

              <button
                onClick={exportContactInfo}
                disabled={students.length === 0}
                className="w-full py-2 px-3 border border-blue-600 text-blue-600 hover:bg-blue-50/50 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Name + Phone + Email</span>
              </button>
            </div>
          </div>

          <button
            onClick={exportFullStudentData}
            disabled={students.length === 0}
            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Full Student Data & Submissions (CSV)</span>
          </button>
        </div>

        {/* Card 2: 1-to-1 Interview Evaluation & Assessment Report */}
        <div className="bg-white rounded-2xl border border-purple-200/90 p-4 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          
          <div className="space-y-3 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 border border-purple-200 shadow-2xs">
                <Award className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">1-to-1 Interview Marks Report</h3>
                <p className="text-[11px] text-purple-700 font-semibold">
                  {evaluatedCount} Evaluated • {pendingEvalCount} Pending
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-xs text-slate-600">
              <p className="text-[11px] leading-relaxed text-slate-500">
                Detailed 6-criterion marks distribution (/20, /20, /20, /15, /15, /10), total score out of 100, letter grade (O, A+, etc.), evaluator identity, and submission timestamps.
              </p>
              <div className="p-2.5 bg-purple-50/70 border border-purple-200/60 rounded-xl text-[10px] space-y-1 text-purple-900">
                <div className="flex justify-between font-medium">
                  <span>Unevaluated entries flagged as:</span>
                  <span className="font-bold font-mono text-[9px] bg-white px-1.5 py-0.5 rounded border border-purple-200">
                    Evaluation Pending / Not Completed Yet
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={exportInterviewEvaluationReport}
            disabled={students.length === 0}
            className="w-full py-2.5 px-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Evaluation Sheet & Marks (CSV)</span>
          </button>
        </div>

        {/* Card 3: Teams Export */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Teams & Squads Export</h3>
                <p className="text-[11px] text-slate-400">{teams.length} Teams Configured</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={exportTeamMembers}
                disabled={teams.length === 0}
                className="w-full py-2 px-3 border border-emerald-600 text-emerald-700 hover:bg-emerald-50/50 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Team Code + Leader Summary</span>
              </button>

              <button
                onClick={exportFullTeamReports}
                disabled={teams.length === 0}
                className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Full Member Rosters & Roles (CSV)</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <select
              value={selectedTeamId}
              onChange={e => setSelectedTeamId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-700 font-medium"
            >
              <option value="">-- Download Specific Team --</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.teamCode || t.teamNumber || 'TM001'}: {t.teamName}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const team = teams.find(t => t.id === selectedTeamId);
                if (team) {
                  const teamCode = team.teamCode || team.teamNumber || 'TM001';
                  const headers = 'Team Code,Team Name,Project Domain,Member Name,Register Number,Department,Assigned Role,Is Leader\n';
                  const rows = team.members.map(m => 
                    `"${teamCode}","${team.teamName}","${team.projectDomain || 'General Civil'}","${m.name}","${m.registerNumber}","${m.department}","${m.assignedRole}","${m.isLeader ? 'Yes' : 'No'}"`
                  ).join('\n');
                  triggerDownload(`${teamCode}_${team.teamName.replace(/\s+/g, '_')}_roster.csv`, headers + rows);
                }
              }}
              disabled={!selectedTeamId}
              className="w-full py-1.5 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Specific Team Roster</span>
            </button>
          </div>
        </div>

        {/* Card 4: Event Reports & Meeting Logs */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Event & Announcement Reports</h3>
                <p className="text-[11px] text-slate-400">{announcements.length} Published Notices</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={exportEvents}
                disabled={announcements.length === 0}
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Full Events Summary (CSV)</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Meetings Log</h4>
                <p className="text-[10px] text-slate-400">Department review minutes</p>
              </div>
            </div>
            <button
              onClick={() => triggerDownload('civil_meetings_log.csv', 'Meeting Title,Date,Attendees,Notes\n"Department Team Review","2026-10-30","All Faculty","Initial planning session completed"')}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Full Meetings Log (CSV)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Wide Card: Overall System Database */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Overall System Database</h3>
            <p className="text-xs text-slate-500">
              Master extraction including developers, faculty coordinators, evaluation scores, and full student database rows.
            </p>
          </div>
        </div>

        <button
          onClick={exportMasterSystemDump}
          className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Master Database Dump (CSV)</span>
        </button>
      </div>
    </div>
  );
};
