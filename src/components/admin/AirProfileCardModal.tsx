import React from 'react';
import { StudentProfile } from '../../types';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  Award, 
  Compass, 
  Truck, 
  Users, 
  ExternalLink, 
  Printer, 
  Copy, 
  Check, 
  ShieldCheck, 
  Link as LinkIcon, 
  Globe 
} from 'lucide-react';

interface AirProfileCardModalProps {
  student: StudentProfile | null;
  onClose: () => void;
  onEdit?: (student: StudentProfile) => void;
}

export const AirProfileCardModal: React.FC<AirProfileCardModalProps> = ({
  student,
  onClose,
  onEdit
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!student) return null;

  const handleCopySummary = () => {
    const summary = `${student.name} (${student.registerNumber}) - ${student.department}, ${student.academicYear}
Email: ${student.email} | Phone: ${student.phone}
Club: ${student.club} | Profile Completion: ${student.profileCompletionPercentage}%
Skills: ${student.skills?.strongestSkills.join(', ') || 'N/A'}
Preferred Role: ${student.teamPreferences?.preferredRole || 'N/A'}
Domain: ${student.teamPreferences?.preferredTechnicalDomain || 'N/A'}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header Card Banner */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-teal-900 text-white px-6 py-5 relative shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-teal-300 border border-teal-400/30">
                Official Student Dossier • AIR Profile Card
              </span>
              <span className="text-[11px] text-blue-200 font-mono">
                {student.confirmationId}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors flex items-center gap-1"
                title="Copy Student Summary"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors flex items-center gap-1"
                title="Print Profile Dossier"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Print</span>
              </button>

              <button
                onClick={onClose}
                className="text-white/70 hover:text-white p-1 rounded-lg transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Student Identity Core */}
          <div className="mt-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white/10 border-2 border-white/20 shadow-md shrink-0 flex items-center justify-center text-blue-200">
              {student.profileImage ? (
                <img
                  src={student.profileImage}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-blue-300" />
              )}
            </div>

            <div className="space-y-1 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-white">
                {student.name}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold font-mono bg-white text-blue-950 shadow-2xs">
                  {student.registerNumber}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-800/80 text-blue-100 border border-blue-700">
                  {student.department}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-teal-800/80 text-teal-100 border border-teal-700">
                  {student.academicYear}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                  student.profileStatus === 'verified'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-400 text-slate-900'
                }`}>
                  {student.profileStatus}
                </span>
              </div>

              <p className="text-xs text-blue-100/90 pt-1 line-clamp-2">
                {student.shortBio || 'Civil Engineering undergraduate documenting skills and team formation strengths.'}
              </p>
            </div>

            {/* Profile Completion Dial */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-3 sm:w-36 shrink-0 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-teal-300 tracking-wider">Completion</span>
              <div className="text-2xl font-black text-white">{student.profileCompletionPercentage}%</div>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-400 rounded-full"
                  style={{ width: `${student.profileCompletionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Dossier Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs">
          
          {/* Institutional Data Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Official College Email</span>
              <p className="font-semibold text-slate-900 truncate mt-0.5" title={student.email}>
                <a href={`mailto:${student.email}`} className="text-blue-700 hover:underline">
                  {student.email}
                </a>
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Phone / WhatsApp</span>
              <p className="font-semibold text-slate-900 mt-0.5">
                <a href={`tel:${student.phone}`} className="hover:underline">
                  {student.phone}
                </a>
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Club / Association</span>
              <p className="font-semibold text-slate-900 truncate mt-0.5" title={student.club}>
                {student.club}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Track Options</span>
              <p className="font-semibold text-slate-900 mt-0.5">
                Japanese: <strong className="text-blue-900">{student.japaneseStudent}</strong> • AWS: <strong className="text-blue-900">{student.awsInterested}</strong>
              </p>
            </div>
          </div>

          {/* Section 1: Strongest Skills */}
          <div className="border border-slate-200 rounded-2xl p-4.5 space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs font-serif flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-700" />
              1. Strongest Personal & Professional Skills ({student.skills?.strongestSkills.length || 0})
            </h4>

            {student.skills?.strongestSkills && student.skills.strongestSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {student.skills.strongestSkills.map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    {skill}
                  </span>
                ))}
                {student.skills.otherSkill && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200">
                    Domain Specialty: {student.skills.otherSkill}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-slate-400 italic">No specific skills submitted yet.</p>
            )}
          </div>

          {/* Section 2: Interest & Focus Areas */}
          <div className="border border-slate-200 rounded-2xl p-4.5 space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs font-serif flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-teal-700" />
              2. Activities, Extracurriculars & Representation Intent
            </h4>

            {student.interests?.activities && student.interests.activities.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {student.interests.activities.map(act => (
                    <span
                      key={act}
                      className="px-2.5 py-1 rounded-xl text-xs font-medium bg-teal-50 text-teal-900 border border-teal-200"
                    >
                      {act}
                    </span>
                  ))}
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] text-white ${
                      student.interests.organizeCollegeEvents ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}>✓</span>
                    <span>Organize College Events: <strong>{student.interests.organizeCollegeEvents ? 'Yes' : 'No'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] text-white ${
                      student.interests.participateExternalEvents ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}>✓</span>
                    <span>Participate in External Hackathons: <strong>{student.interests.participateExternalEvents ? 'Yes' : 'No'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] text-white ${
                      student.interests.applyFundingOpportunities ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}>✓</span>
                    <span>Apply for MSME/Govt Schemes: <strong>{student.interests.applyFundingOpportunities ? 'Yes' : 'No'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] text-white ${
                      student.interests.representCollege ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}>✓</span>
                    <span>Represent College Nationally: <strong>{student.interests.representCollege ? 'Yes' : 'No'}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 italic">No activity preferences recorded.</p>
            )}
          </div>

          {/* Section 3: Technical Strengths & Logistics */}
          <div className="border border-slate-200 rounded-2xl p-4.5 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs font-serif flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-indigo-700" />
              3. Team Roles & Operational Logistics Capabilities
            </h4>

            <div className="space-y-2">
              <span className="font-semibold text-slate-800 text-[11px]">Primary Team Contributions:</span>
              <div className="flex flex-wrap gap-1.5">
                {student.teamStrengths?.roles.map(r => (
                  <span key={r} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            {student.teamStrengths?.logisticsSkills && student.teamStrengths.logisticsSkills.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-800 text-[11px]">Operations & Travel Logistics:</span>
                <div className="flex flex-wrap gap-1.5">
                  {student.teamStrengths.logisticsSkills.map(l => (
                    <span key={l} className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {student.teamStrengths?.additionalContributions && (
              <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px]">
                <strong className="text-slate-900">Additional Contributions:</strong> {student.teamStrengths.additionalContributions}
              </p>
            )}
          </div>

          {/* Section 4: Team Formation Preferences & Links */}
          <div className="border border-slate-200 rounded-2xl p-4.5 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs font-serif flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-700" />
              4. Team Formation Preferences & Readiness
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 uppercase text-[9px] font-bold">Preferred Role</span>
                <p className="font-bold text-slate-900">{student.teamPreferences?.preferredRole || 'Technical Member'}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 uppercase text-[9px] font-bold">Technical Domain</span>
                <p className="font-bold text-slate-900 truncate" title={student.teamPreferences?.preferredTechnicalDomain}>
                  {student.teamPreferences?.preferredTechnicalDomain || 'Civil Eng'}
                </p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 uppercase text-[9px] font-bold">Team Size</span>
                <p className="font-bold text-slate-900">{student.teamPreferences?.preferredTeamSize || '4-5'}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 uppercase text-[9px] font-bold">Willing to Travel</span>
                <p className="font-bold text-slate-900">{student.teamPreferences?.willingnessToTravel ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Portfolio Links */}
            {(student.teamPreferences?.linkedinProfile || student.teamPreferences?.githubProfile || student.teamPreferences?.portfolioWebsite) && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                {student.teamPreferences?.linkedinProfile && (
                  <a
                    href={student.teamPreferences.linkedinProfile}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg"
                  >
                    <LinkIcon className="w-3 h-3" /> LinkedIn Profile <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {student.teamPreferences?.githubProfile && (
                  <a
                    href={student.teamPreferences.githubProfile}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg"
                  >
                    <Globe className="w-3 h-3" /> GitHub Projects <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {student.teamPreferences?.portfolioWebsite && (
                  <a
                    href={student.teamPreferences.portfolioWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg"
                  >
                    <Globe className="w-3 h-3" /> Portfolio Website <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-mono">
            Record ID: {student.id} • Registered: {student.registrationDate}
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(student);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl"
              >
                Edit Record
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
