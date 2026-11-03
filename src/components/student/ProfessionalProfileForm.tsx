import React, { useState } from 'react';
import { 
  StudentProfile, 
  ProfessionalSkills, 
  InterestAndFocusAreas, 
  TeamRolesAndStrengths, 
  TeamPreferences 
} from '../../types';
import { storageService } from '../../services/storageService';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Send, 
  Sparkles, 
  Award, 
  Users, 
  Compass, 
  Truck, 
  FileText, 
  Check, 
  ExternalLink,
  Globe,
  Link as LinkIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProfessionalProfileFormProps {
  student: StudentProfile;
  onProfileSubmitted: (updated: StudentProfile) => void;
}

const CORE_SKILLS = [
  'Communication Skills',
  'Leadership',
  'Team Management',
  'Time Management',
  'Problem Solving',
  'Critical Thinking',
  'Creativity and Innovation',
  'Decision Making',
  'Public Speaking',
  'Adaptability'
];

const INTEREST_ACTIVITIES = [
  'Event Hosting and Coordination',
  'Event Committee Organization',
  'Hackathon Participation',
  'Hackathon Organization',
  'Project Development',
  'Startup and Entrepreneurship',
  'MSME / Government Scheme Applications',
  'Research and Development',
  'Workshops and Technical Training',
  'Club and Association Activities'
];

const TEAM_ROLES = [
  'Team Leader',
  'Hardware Development',
  'Software Development',
  'UI/UX Design',
  'Research and Development',
  'Documentation',
  'Presentation and Pitching',
  'Testing and Validation',
  'Project Management',
  'Marketing and Communication'
];

const LOGISTICS_SKILLS = [
  'Travel Planning',
  'Ticket Booking',
  'Accommodation / Room Booking',
  'Route Planning',
  'Event Logistics',
  'Budget Planning',
  'Resource Management',
  'External Communication'
];

export const ProfessionalProfileForm: React.FC<ProfessionalProfileFormProps> = ({
  student,
  onProfileSubmitted
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedSuccessfully, setHasSubmittedSuccessfully] = useState(false);

  // Form State initialized from student's existing record or defaults
  const [skills, setSkills] = useState<ProfessionalSkills>({
    strongestSkills: student.skills?.strongestSkills || [],
    otherSkill: student.skills?.otherSkill || ''
  });

  const [interests, setInterests] = useState<InterestAndFocusAreas>({
    activities: student.interests?.activities || [],
    organizeCollegeEvents: student.interests?.organizeCollegeEvents ?? false,
    participateExternalEvents: student.interests?.participateExternalEvents ?? false,
    applyFundingOpportunities: student.interests?.applyFundingOpportunities ?? false,
    representCollege: student.interests?.representCollege ?? false,
    organizeTechnicalWorkshops: student.interests?.organizeTechnicalWorkshops ?? false,
    customInterests: student.interests?.customInterests || ''
  });

  const [teamStrengths, setTeamStrengths] = useState<TeamRolesAndStrengths>({
    roles: student.teamStrengths?.roles || [],
    logisticsSkills: student.teamStrengths?.logisticsSkills || [],
    additionalContributions: student.teamStrengths?.additionalContributions || ''
  });

  const [teamPreferences, setTeamPreferences] = useState<TeamPreferences>({
    preferredRole: student.teamPreferences?.preferredRole || '',
    preferredTechnicalDomain: student.teamPreferences?.preferredTechnicalDomain || '',
    projectMode: student.teamPreferences?.projectMode || 'Team',
    preferredTeamSize: student.teamPreferences?.preferredTeamSize || '',
    previousProjectExperience: student.teamPreferences?.previousProjectExperience || '',
    hackathonExperience: student.teamPreferences?.hackathonExperience || '',
    previousEventParticipation: student.teamPreferences?.previousEventParticipation || '',
    availability: student.teamPreferences?.availability || 'Flexible',
    willingnessToTravel: student.teamPreferences?.willingnessToTravel ?? false,
    preferredProjectCategories: student.teamPreferences?.preferredProjectCategories || [],
    workedInTeam: student.teamPreferences?.workedInTeam ?? false,
    participatedInHackathon: student.teamPreferences?.participatedInHackathon ?? false,
    developedTechnicalProject: student.teamPreferences?.developedTechnicalProject ?? false,
    hasProjectPortfolio: student.teamPreferences?.hasProjectPortfolio ?? false,
    willingToLeadTeam: student.teamPreferences?.willingToLeadTeam ?? false,
    collaborateAcrossDepartments: student.teamPreferences?.collaborateAcrossDepartments ?? false,
    githubProfile: student.teamPreferences?.githubProfile || '',
    linkedinProfile: student.teamPreferences?.linkedinProfile || '',
    portfolioWebsite: student.teamPreferences?.portfolioWebsite || '',
    previousProjectLinks: student.teamPreferences?.previousProjectLinks || ''
  });

  // Toggle helper
  const toggleArrayItem = (list: string[], item: string): string[] => {
    return list.includes(item) ? list.filter(i => i !== item) : [...list, item];
  };

  const handleSaveDraft = async () => {
    setSaveMessage('Saving draft...');
    try {
      const updated = await storageService.saveStudent({
        ...student,
        skills,
        interests,
        teamStrengths,
        teamPreferences,
        profileStatus: 'draft'
      });
      onProfileSubmitted(updated);
      setSaveMessage('Draft saved successfully! You can resume anytime.');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage('Failed to save draft.');
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSaveMessage(null);
    try {
      const updated = await storageService.saveStudent({
        ...student,
        skills,
        interests,
        teamStrengths,
        teamPreferences,
        profileStatus: 'pending_review',
        verificationStatus: 'pending',
        submittedAt: new Date().toISOString()
      });

      // Trigger Confetti!
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback if canvas not available
      }

      onProfileSubmitted(updated);
      setHasSubmittedSuccessfully(true);
    } catch (err) {
      console.error('Submission failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Skills', icon: Sparkles },
    { number: 2, title: 'Interests & Focus', icon: Compass },
    { number: 3, title: 'Team Strengths & Logistics', icon: Truck },
    { number: 4, title: 'Team Preferences', icon: Users },
    { number: 5, title: 'Review & Submit', icon: CheckCircle2 }
  ];

  if (hasSubmittedSuccessfully) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs p-8 text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 font-serif">
          Your professional profile has been submitted successfully!
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your skills, focus areas, and team formation preferences have been securely registered to the CIVIL CONNECT database. 
          The Faculty Advisory Committee will review your submission for mapping into upcoming hackathon and symposium teams.
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <button
            onClick={() => setHasSubmittedSuccessfully(false)}
            className="px-4 py-2 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl"
          >
            Review or Edit Submission
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form Progress Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-blue-950 font-serif">
              Professional Profile Collection Form
            </h2>
            <p className="text-xs text-slate-500">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Save Draft</span>
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="mt-5 grid grid-cols-5 gap-2.5">
          {steps.map(s => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;
            return (
              <button
                key={s.number}
                type="button"
                onClick={() => setCurrentStep(s.number)}
                className={`flex flex-col items-center p-3 rounded-2xl border-2 text-center transition-all ${
                  isCurrent
                    ? 'border-blue-700 bg-blue-50/80 text-blue-950 font-extrabold shadow-xs'
                    : isCompleted
                    ? 'border-emerald-300 bg-emerald-50/60 text-emerald-950 font-bold'
                    : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 shadow-2xs ${
                  isCurrent
                    ? 'bg-blue-900 text-white'
                    : isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.number}
                </div>
                <span className="text-xs font-bold leading-tight line-clamp-1">
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>

        {saveMessage && (
          <div className="mt-3.5 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-xs text-blue-900 font-bold text-center shadow-2xs">
            {saveMessage}
          </div>
        )}
      </div>

      {/* Main Form Body */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-7">
        {/* SECTION 1: PERSONAL SKILLS */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-900 uppercase tracking-wider mb-1">
                Section 1 of 4
              </div>
              <h3 className="text-xl font-extrabold text-slate-950 font-serif">
                What are your strongest personal and professional skills?
              </h3>
              <p className="text-xs font-medium text-slate-600 mt-1">
                Select all that apply. These will be highlighted on your verified student profile and matched for team leadership roles.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {CORE_SKILLS.map(skill => {
                const isSelected = skills.strongestSkills.includes(skill);
                return (
                  <label
                    key={skill}
                    className={`flex items-center gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-700 bg-blue-50/70 shadow-2xs font-bold text-blue-950'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        setSkills({
                          ...skills,
                          strongestSkills: toggleArrayItem(skills.strongestSkills, skill)
                        })
                      }
                      className="rounded text-blue-800 focus:ring-blue-700 w-5 h-5 border-slate-300"
                    />
                    <span className="text-sm font-bold text-slate-900">{skill}</span>
                  </label>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs uppercase font-extrabold text-blue-950 tracking-wider mb-1.5">
                Other Specialized Skill or Domain:
              </label>
              <input
                type="text"
                value={skills.otherSkill || ''}
                onChange={e => setSkills({ ...skills, otherSkill: e.target.value })}
                placeholder="e.g. AutoCAD 3D Drafting, Total Station Surveying, Primavera P6..."
                className="w-full px-4 py-3 text-sm font-semibold border-2 border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all"
              />
            </div>
          </div>
        )}

        {/* SECTION 2: INTEREST AND FOCUS AREAS */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-teal-900 uppercase tracking-wider mb-1">
                Section 2 of 4
              </div>
              <h3 className="text-xl font-extrabold text-slate-950 font-serif">
                What activities and focus areas are you interested in?
              </h3>
              <p className="text-xs font-medium text-slate-600 mt-1">
                Indicate the extracurricular, technical, and leadership events you wish to represent the college in.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {INTEREST_ACTIVITIES.map(activity => {
                const isSelected = interests.activities.includes(activity);
                return (
                  <label
                    key={activity}
                    className={`flex items-center gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-700 bg-teal-50/70 shadow-2xs font-bold text-teal-950'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        setInterests({
                          ...interests,
                          activities: toggleArrayItem(interests.activities, activity)
                        })
                      }
                      className="rounded text-teal-700 focus:ring-teal-700 w-5 h-5 border-slate-300"
                    />
                    <span className="text-sm font-bold text-slate-900">{activity}</span>
                  </label>
                );
              })}
            </div>

            {/* Additional 5 Specific Preference Checkboxes */}
            <div className="bg-slate-50/90 rounded-2xl p-5 border-2 border-slate-200 space-y-3.5">
              <h4 className="font-extrabold text-xs uppercase text-slate-950 tracking-wider">Department & College Representation Preferences:</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={interests.organizeCollegeEvents}
                    onChange={e => setInterests({ ...interests, organizeCollegeEvents: e.target.checked })}
                    className="rounded text-blue-700 w-5 h-5 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-900">Interested in organizing college events and symposiums?</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={interests.participateExternalEvents}
                    onChange={e => setInterests({ ...interests, participateExternalEvents: e.target.checked })}
                    className="rounded text-blue-700 w-5 h-5 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-900">Interested in participating in external inter-college competitions?</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={interests.applyFundingOpportunities}
                    onChange={e => setInterests({ ...interests, applyFundingOpportunities: e.target.checked })}
                    className="rounded text-blue-700 w-5 h-5 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-900">Interested in applying for government funding & MSME scheme grants?</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={interests.representCollege}
                    onChange={e => setInterests({ ...interests, representCollege: e.target.checked })}
                    className="rounded text-blue-700 w-5 h-5 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-900">Interested in officially representing the college at national conferences?</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={interests.organizeTechnicalWorkshops}
                    onChange={e => setInterests({ ...interests, organizeTechnicalWorkshops: e.target.checked })}
                    className="rounded text-blue-700 w-5 h-5 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-900">Interested in organizing technical workshops for junior students?</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-extrabold text-teal-950 tracking-wider mb-1.5">
                Custom Interests / Specific Research Focus:
              </label>
              <input
                type="text"
                value={interests.customInterests || ''}
                onChange={e => setInterests({ ...interests, customInterests: e.target.value })}
                placeholder="e.g. Geotechnical soil mechanics, earthquake dampers, AI in construction scheduling..."
                className="w-full px-4 py-3 text-sm font-semibold border-2 border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 shadow-2xs transition-all"
              />
            </div>
          </div>
        )}

        {/* SECTION 3: TEAM ROLE & TECHNICAL STRENGTHS */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-900 uppercase tracking-wider mb-1">
                Section 3 of 4
              </div>
              <h3 className="text-xl font-extrabold text-slate-950 font-serif">
                What role can you contribute to a team?
              </h3>
              <p className="text-xs font-medium text-slate-600 mt-1">
                Select your primary team contributions, including technical specialties and crucial operations/logistics roles.
              </p>
            </div>

            {/* Technical Roles */}
            <div>
              <h4 className="text-xs uppercase font-extrabold text-indigo-950 tracking-wider mb-2.5">
                Primary Technical & Project Roles:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {TEAM_ROLES.map(role => {
                  const isSelected = teamStrengths.roles.includes(role);
                  return (
                    <label
                      key={role}
                      className={`flex items-center gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-700 bg-indigo-50/70 shadow-2xs font-bold text-indigo-950'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          setTeamStrengths({
                            ...teamStrengths,
                            roles: toggleArrayItem(teamStrengths.roles, role)
                          })
                        }
                        className="rounded text-indigo-800 focus:ring-indigo-700 w-5 h-5 border-slate-300"
                      />
                      <span className="text-sm font-bold text-slate-900">{role}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Logistics & Operations Subcategory */}
            <div className="pt-3 border-t border-slate-100">
              <div className="mb-2.5">
                <h4 className="text-xs uppercase font-extrabold text-teal-950 tracking-wider">
                  Other Category – Logistics and Operations Capabilities:
                </h4>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  Vital capabilities for hackathon travel, symposium coordination, and budget management.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {LOGISTICS_SKILLS.map(skill => {
                  const isSelected = teamStrengths.logisticsSkills.includes(skill);
                  return (
                    <label
                      key={skill}
                      className={`flex items-center gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-700 bg-teal-50/70 shadow-2xs font-bold text-teal-950'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          setTeamStrengths({
                            ...teamStrengths,
                            logisticsSkills: toggleArrayItem(teamStrengths.logisticsSkills, skill)
                          })
                        }
                        className="rounded text-teal-700 focus:ring-teal-700 w-5 h-5 border-slate-300"
                      />
                      <span className="text-sm font-bold text-slate-900">{skill}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs uppercase font-extrabold text-indigo-950 tracking-wider mb-1.5">
                Describe any additional skills or contributions you can provide:
              </label>
              <textarea
                rows={4}
                value={teamStrengths.additionalContributions || ''}
                onChange={e =>
                  setTeamStrengths({
                    ...teamStrengths,
                    additionalContributions: e.target.value
                  })
                }
                placeholder="e.g. Experience with hardware sensors, drone piloting, technical report authoring..."
                className="w-full px-4 py-3 text-sm font-medium border-2 border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs transition-all leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* SECTION 4: TEAM FORMATION PREFERENCES */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-purple-900 uppercase tracking-wider mb-1">
                Section 4 of 4
              </div>
              <h3 className="text-xl font-extrabold text-slate-950 font-serif">
                Team Formation Preferences & Portfolio Links
              </h3>
              <p className="text-xs font-medium text-slate-600 mt-1">
                These preferences guide the intelligent team formation engine to pair you with complementary team members.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs uppercase font-extrabold text-blue-950 tracking-wider mb-1.5">
                  Preferred Team Role:
                </label>
                <select
                  value={teamPreferences.preferredRole}
                  onChange={e => setTeamPreferences({ ...teamPreferences, preferredRole: e.target.value })}
                  className="w-full px-4 py-3 text-sm font-semibold border-2 border-slate-300 rounded-xl bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all"
                >
                  <option value="Team Leader">Team Leader</option>
                  <option value="Technical Specialist">Technical Specialist</option>
                  <option value="Research & Design Lead">Research & Design Lead</option>
                  <option value="Logistics & Operations Coordinator">Logistics & Operations Coordinator</option>
                  <option value="Documentation & Pitch Presenter">Documentation & Pitch Presenter</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-extrabold text-blue-950 tracking-wider mb-1.5">
                  Preferred Technical Domain:
                </label>
                <input
                  type="text"
                  value={teamPreferences.preferredTechnicalDomain}
                  onChange={e => setTeamPreferences({ ...teamPreferences, preferredTechnicalDomain: e.target.value })}
                  placeholder="e.g. Smart Cities, Green Infrastructure, IoT Surveying"
                  className="w-full px-4 py-3 text-sm font-semibold border-2 border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-extrabold text-blue-950 tracking-wider mb-1.5">
                  Project Mode:
                </label>
                <select
                  value={teamPreferences.projectMode}
                  onChange={e => setTeamPreferences({ ...teamPreferences, projectMode: e.target.value as any })}
                  className="w-full px-4 py-3 text-sm font-semibold border-2 border-slate-300 rounded-xl bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all"
                >
                  <option value="Team">Team Collaboration</option>
                  <option value="Individual">Individual Work</option>
                  <option value="Both">Both Team & Individual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-extrabold text-blue-950 tracking-wider mb-1.5">
                  Preferred Team Size:
                </label>
                <select
                  value={teamPreferences.preferredTeamSize}
                  onChange={e => setTeamPreferences({ ...teamPreferences, preferredTeamSize: e.target.value })}
                  className="w-full px-4 py-3 text-sm font-semibold border-2 border-slate-300 rounded-xl bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all"
                >
                  <option value="3-4 Members">3-4 Members</option>
                  <option value="4-5 Members">4-5 Members</option>
                  <option value="5-6 Members">5-6 Members</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-extrabold text-blue-950 tracking-wider mb-1.5">
                  Availability for Team Activities:
                </label>
                <select
                  value={teamPreferences.availability}
                  onChange={e => setTeamPreferences({ ...teamPreferences, availability: e.target.value as any })}
                  className="w-full px-4 py-3 text-sm font-semibold border-2 border-slate-300 rounded-xl bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all"
                >
                  <option value="High (10+ hrs/wk)">High (10+ hours per week)</option>
                  <option value="Medium (5-10 hrs/wk)">Medium (5-10 hours per week)</option>
                  <option value="Flexible">Flexible / Weekend intensive</option>
                </select>
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={teamPreferences.willingnessToTravel}
                    onChange={e => setTeamPreferences({ ...teamPreferences, willingnessToTravel: e.target.checked })}
                    className="rounded text-blue-700 w-5 h-5 border-slate-300"
                  />
                  <span className="text-sm font-bold text-slate-900">Willing to travel for out-of-station competitions?</span>
                </label>
              </div>
            </div>

            {/* Yes/No Experience Checks */}
            <div className="bg-slate-50/90 p-5 rounded-2xl border-2 border-slate-200 space-y-3">
              <h4 className="font-extrabold text-xs uppercase text-slate-950 tracking-wider">Experience & Readiness Checklist:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={teamPreferences.workedInTeam}
                    onChange={e => setTeamPreferences({ ...teamPreferences, workedInTeam: e.target.checked })}
                    className="rounded text-blue-700 w-5 h-5 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-900">Have you previously worked in a team?</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={teamPreferences.participatedInHackathon}
                    onChange={e => setTeamPreferences({ ...teamPreferences, participatedInHackathon: e.target.checked })}
                    className="rounded text-blue-700 w-5 h-5 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-900">Have you participated in any hackathon?</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={teamPreferences.developedTechnicalProject}
                    onChange={e => setTeamPreferences({ ...teamPreferences, developedTechnicalProject: e.target.checked })}
                    className="rounded text-blue-700 w-5 h-5 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-900">Have you developed any technical project?</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={teamPreferences.willingToLeadTeam}
                    onChange={e => setTeamPreferences({ ...teamPreferences, willingToLeadTeam: e.target.checked })}
                    className="rounded text-blue-700 w-5 h-5 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-900">Are you willing to lead a team?</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={teamPreferences.collaborateAcrossDepartments}
                    onChange={e => setTeamPreferences({ ...teamPreferences, collaborateAcrossDepartments: e.target.checked })}
                    className="rounded text-blue-700 w-5 h-5 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-900">Willing to collaborate across other departments (CSE/Mech/ECE)?</span>
                </label>
              </div>
            </div>

            {/* Portfolio Links */}
            <div className="space-y-3.5 pt-3 border-t border-slate-100">
              <h4 className="font-extrabold text-xs uppercase text-slate-950 tracking-wider">Portfolio & Profile URLs (Optional):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={teamPreferences.linkedinProfile || ''}
                    onChange={e => setTeamPreferences({ ...teamPreferences, linkedinProfile: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full pl-10 pr-4 py-3 text-sm font-semibold border-2 border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={teamPreferences.githubProfile || ''}
                    onChange={e => setTeamPreferences({ ...teamPreferences, githubProfile: e.target.value })}
                    placeholder="https://github.com/username"
                    className="w-full pl-10 pr-4 py-3 text-sm font-semibold border-2 border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all"
                  />
                </div>

                <div className="relative sm:col-span-2">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={teamPreferences.portfolioWebsite || ''}
                    onChange={e => setTeamPreferences({ ...teamPreferences, portfolioWebsite: e.target.value })}
                    placeholder="Personal Portfolio or Project Showcase URL (e.g. https://portfolio.me)"
                    className="w-full pl-10 pr-4 py-3 text-sm font-semibold border-2 border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: REVIEW & SUBMIT */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xl font-extrabold text-slate-950 font-serif">
                Review Your Professional Profile
              </h3>
              <p className="text-xs font-medium text-slate-600 mt-1">
                Please verify your details before submitting to the department database. You can still modify these later if required.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Section 1 Review */}
              <div className="bg-slate-50/90 p-5 rounded-2xl border-2 border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-700" /> Strongest Skills ({skills.strongestSkills.length})
                  </h4>
                  <button onClick={() => setCurrentStep(1)} className="text-blue-700 hover:underline text-xs font-bold">
                    Edit
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.strongestSkills.map(s => (
                    <span key={s} className="px-3 py-1 rounded-xl bg-blue-100 text-blue-950 text-xs font-bold border border-blue-200">
                      {s}
                    </span>
                  ))}
                  {skills.otherSkill && (
                    <span className="px-3 py-1 rounded-xl bg-blue-200 text-blue-950 text-xs font-extrabold border border-blue-300">
                      {skills.otherSkill}
                    </span>
                  )}
                </div>
              </div>

              {/* Section 2 Review */}
              <div className="bg-slate-50/90 p-5 rounded-2xl border-2 border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                    <Compass className="w-4 h-4 text-teal-700" /> Focus Areas & Activities ({interests.activities.length})
                  </h4>
                  <button onClick={() => setCurrentStep(2)} className="text-teal-700 hover:underline text-xs font-bold">
                    Edit
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {interests.activities.map(a => (
                    <span key={a} className="px-3 py-1 rounded-xl bg-teal-100 text-teal-950 text-xs font-bold border border-teal-200">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Section 3 Review */}
              <div className="bg-slate-50/90 p-5 rounded-2xl border-2 border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-700" /> Roles & Logistics Capabilities
                  </h4>
                  <button onClick={() => setCurrentStep(3)} className="text-indigo-700 hover:underline text-xs font-bold">
                    Edit
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {teamStrengths.roles.map(r => (
                      <span key={r} className="px-3 py-1 rounded-xl bg-indigo-100 text-indigo-950 text-xs font-bold border border-indigo-200">
                        {r}
                      </span>
                    ))}
                  </div>
                  {teamStrengths.logisticsSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {teamStrengths.logisticsSkills.map(l => (
                        <span key={l} className="px-3 py-1 rounded-xl bg-slate-200 text-slate-900 text-xs font-semibold">
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4 Review */}
              <div className="bg-slate-50/90 p-5 rounded-2xl border-2 border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-700" /> Team Preferences
                  </h4>
                  <button onClick={() => setCurrentStep(4)} className="text-purple-700 hover:underline text-xs font-bold">
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>Preferred Role: <strong className="text-slate-950 font-bold">{teamPreferences.preferredRole}</strong></div>
                  <div>Domain: <strong className="text-slate-950 font-bold">{teamPreferences.preferredTechnicalDomain || 'Not specified'}</strong></div>
                  <div>Availability: <strong className="text-slate-950 font-bold">{teamPreferences.availability}</strong></div>
                  <div>Lead Team: <strong className="text-slate-950 font-bold">{teamPreferences.willingToLeadTeam ? 'Yes' : 'No'}</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Controls */}
        <div className="mt-8 pt-5 border-t border-slate-200 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-300"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-5 py-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border-2 border-slate-300 rounded-xl shadow-2xs transition-colors"
            >
              Save Draft
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold text-white bg-blue-900 hover:bg-blue-950 rounded-xl shadow-xs transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="inline-flex items-center gap-2 px-7 py-3 text-sm font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-md transition-colors"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting Profile...' : 'Submit Profile'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
