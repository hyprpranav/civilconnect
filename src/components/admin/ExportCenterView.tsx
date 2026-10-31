import React, { useState } from 'react';
import { StudentProfile, TeamFormation, Announcement } from '../../types';
import { 
  Download, 
  Users, 
  Calendar, 
  FileSpreadsheet, 
  Database, 
  FileText, 
  CheckCircle2,
  Clock
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
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 1. Export Student Name + Register Number
  const exportNameRegNo = () => {
    const headers = 'Register Number,Name,Department,Academic Year\n';
    const rows = students.map(s => `"${s.registerNumber}","${s.name}","${s.department}","${s.academicYear}"`).join('\n');
    triggerDownload(`civil_students_name_regno_${Date.now()}.csv`, headers + rows);
  };

  // 2. Export Name + Phone + Email
  const exportContactInfo = () => {
    const headers = 'Register Number,Name,Official Email,Phone Number,Department\n';
    const rows = students.map(s => `"${s.registerNumber}","${s.name}","${s.email}","${s.phone}","${s.department}"`).join('\n');
    triggerDownload(`civil_students_contact_directory_${Date.now()}.csv`, headers + rows);
  };

  // 3. Full Student Data (CSV)
  const exportFullStudentData = () => {
    const headers = 'Register Number,Name,Department,Academic Year,Official Email,Phone Number,Skills,Focus Areas,Preferred Role,Travel Willing,Leader Willing,Completion Percentage\n';
    const rows = students.map(s => {
      const skills = (s.skills?.strongestSkills || []).join('; ');
      const interests = (s.interests?.activities || []).join('; ');
      const role = s.teamPreferences?.preferredRole || '';
      const travel = s.teamPreferences?.willingnessToTravel ? 'Yes' : 'No';
      const lead = s.teamPreferences?.willingToLeadTeam ? 'Yes' : 'No';
      return `"${s.registerNumber}","${s.name}","${s.department}","${s.academicYear}","${s.email}","${s.phone}","${skills}","${interests}","${role}","${travel}","${lead}",${s.profileCompletionPercentage}%`;
    }).join('\n');
    triggerDownload(`civil_connect_full_student_roster_${Date.now()}.csv`, headers + rows);
  };

  // 4. Team Export
  const exportTeamMembers = () => {
    const headers = 'Team Name,Leader Name,Leader RegNo,Total Members,Project Domain,Status\n';
    const rows = teams.map(t => {
      const leader = t.members.find(m => m.isLeader);
      return `"${t.teamName}","${leader?.name || 'Assigned'}","${leader?.registerNumber || ''}",${t.members.length},"${t.projectDomain || 'General Civil'}","${t.status}"`;
    }).join('\n');
    triggerDownload(`civil_teams_roster_${Date.now()}.csv`, headers + rows);
  };

  // 5. Full Team Reports
  const exportFullTeamReports = () => {
    const headers = 'Team Name,Status,Member Name,Register Number,Department,Assigned Role\n';
    const rows = teams.flatMap(t => 
      t.members.map(m => `"${t.teamName}","${t.status}","${m.name}","${m.registerNumber}","${m.department}","${m.assignedRole}"`)
    ).join('\n');
    triggerDownload(`civil_teams_detailed_report_${Date.now()}.csv`, headers + rows);
  };

  // 6. Events / Announcements Export
  const exportEvents = () => {
    const headers = 'Title,Category,Published By,Published At,Important\n';
    const rows = announcements.map(a => `"${a.title}","${a.category}","${a.publishedBy}","${a.publishedAt}","${a.isImportant ? 'Yes' : 'No'}"`).join('\n');
    triggerDownload(`civil_events_announcements_${Date.now()}.csv`, headers + rows);
  };

  // 7. Overall System Database (Full Dump)
  const exportMasterSystemDump = () => {
    const meta = `# CIVIL CONNECT - Master Extraction Dump\n# Exported At: ${new Date().toISOString()}\n# Total Active Students: ${students.length}\n# Total Active Teams: ${teams.length}\n\n`;
    const headers = 'Record Type,ID,Name,Department,Email,Details\n';
    const studentRows = students.map(s => `"Student","${s.registerNumber}","${s.name}","${s.department}","${s.email}","Completion: ${s.profileCompletionPercentage}%"`).join('\n');
    const teamRows = teams.map(t => {
      const leader = t.members.find(m => m.isLeader);
      return `"Team","${t.id}","${t.teamName}","Civil Engineering","Leader: ${leader?.name || 'Assigned'}","Members: ${t.members.length}"`;
    }).join('\n');
    triggerDownload(`civil_connect_master_database_${Date.now()}.csv`, meta + headers + studentRows + '\n' + teamRows);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans tracking-tight">
          Export Center
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Download sanitized student rosters, team lists, and event reports in CSV format.
        </p>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Grid of 3 Cards (Matching Screenshot 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Student Rosters */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Student Rosters</h3>
                <p className="text-[11px] text-slate-400">Export student details</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={exportNameRegNo}
                disabled={students.length === 0}
                className="w-full py-2 px-3 border border-blue-600 text-blue-600 hover:bg-blue-50/50 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Name + Register Number</span>
              </button>

              <button
                onClick={exportContactInfo}
                disabled={students.length === 0}
                className="w-full py-2 px-3 border border-blue-600 text-blue-600 hover:bg-blue-50/50 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
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
            <span>Full Student Data (CSV)</span>
          </button>
        </div>

        {/* Card 2: Teams Export */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Teams Export</h3>
                <p className="text-[11px] text-slate-400">Export team arrangements</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={exportTeamMembers}
                disabled={teams.length === 0}
                className="w-full py-2 px-3 border border-blue-600 text-blue-600 hover:bg-blue-50/50 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Team Name + Members</span>
              </button>

              <button
                onClick={exportFullTeamReports}
                disabled={teams.length === 0}
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Full Team Reports (CSV)</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <select
              value={selectedTeamId}
              onChange={e => setSelectedTeamId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600"
            >
              <option value="">-- Download Specific Team --</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.teamName}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const team = teams.find(t => t.id === selectedTeamId);
                if (team) {
                  const headers = 'Member Name,Register Number,Department,Role\n';
                  const rows = team.members.map(m => `"${m.name}","${m.registerNumber}","${m.department}","${m.assignedRole}"`).join('\n');
                  triggerDownload(`${team.teamName.replace(/\s+/g, '_')}_roster.csv`, headers + rows);
                }
              }}
              disabled={!selectedTeamId}
              className="w-full py-1.5 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Team Details</span>
            </button>
          </div>
        </div>

        {/* Card 3: Event Reports & Meeting Logs */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Event Reports</h3>
                <p className="text-[11px] text-slate-400">Export event history</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={exportEvents}
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
                <p className="text-[10px] text-slate-400">Export meeting details</p>
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

      {/* Bottom Wide Card: Overall System Database (Matching Screenshot 3 bottom banner) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Overall System Database</h3>
            <p className="text-xs text-slate-500">
              Master extraction including developers, faculty coordinators, and full student database rows.
            </p>
          </div>
        </div>

        <button
          onClick={exportMasterSystemDump}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Every Data Row (CSV)</span>
        </button>
      </div>
    </div>
  );
};
