import React, { useState, useEffect } from 'react';
import { 
  X, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Save, 
  User, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  BadgeCheck
} from 'lucide-react';
import { 
  StudentProfile, 
  UserAccount, 
  InterviewEvaluation, 
  InterviewCriterionMark, 
  InterviewGrade 
} from '../../types';

interface InterviewEvaluationModalProps {
  student: StudentProfile;
  currentUser: UserAccount;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedStudent: StudentProfile) => Promise<void>;
}

// 6 Structured Categories summing up to exactly 100 Marks
const DEFAULT_CRITERIA: { id: string; name: string; category: string; maxMarks: number; description: string }[] = [
  {
    id: 'tech_knowledge',
    name: 'Technical Knowledge & Engineering Core',
    category: 'Technical Fundamentals',
    maxMarks: 20,
    description: 'Understanding of civil/engineering fundamentals, structural concepts, and modern tools.'
  },
  {
    id: 'communication',
    name: 'Communication & Articulation Skills',
    category: 'Soft Skills',
    maxMarks: 20,
    description: 'Clarity of speech, confidence, active listening, and ability to present ideas professionally.'
  },
  {
    id: 'problem_solving',
    name: 'Problem Solving & Analytical Aptitude',
    category: 'Analytical Thinking',
    maxMarks: 20,
    description: 'Structured thinking, troubleshooting approach, logical flow, and handling tricky questions.'
  },
  {
    id: 'project_experience',
    name: 'Project Experience & Hands-On Execution',
    category: 'Practical Execution',
    maxMarks: 15,
    description: 'Depth of previous academic/hackathon projects, portfolio quality, and practical domain knowledge.'
  },
  {
    id: 'teamwork_attitude',
    name: 'Teamwork, Attitude & Professionalism',
    category: 'Interpersonal',
    maxMarks: 15,
    description: 'Collaborative mindset, attitude towards feedback, adaptability, and emotional maturity.'
  },
  {
    id: 'initiative_fit',
    name: 'Domain Passion, Initiative & Club Fit',
    category: 'Proactiveness',
    maxMarks: 10,
    description: 'Enthusiasm for hackathons/competitions, self-driven learning, and willingness to represent the department.'
  }
];

export const calculateGrade = (score: number): InterviewGrade => {
  if (score >= 90) return 'O (Outstanding)';
  if (score >= 80) return 'A+ (Excellent)';
  if (score >= 70) return 'A (Very Good)';
  if (score >= 60) return 'B+ (Good)';
  if (score >= 50) return 'B (Above Average)';
  if (score >= 40) return 'C (Pass)';
  return 'RA (Re-evaluate)';
};

export const getGradeBadgeColor = (grade: InterviewGrade): string => {
  if (grade.startsWith('O')) return 'bg-purple-100 text-purple-900 border-purple-300';
  if (grade.startsWith('A+')) return 'bg-emerald-100 text-emerald-900 border-emerald-300';
  if (grade.startsWith('A')) return 'bg-teal-100 text-teal-900 border-teal-300';
  if (grade.startsWith('B+')) return 'bg-blue-100 text-blue-900 border-blue-300';
  if (grade.startsWith('B')) return 'bg-indigo-100 text-indigo-900 border-indigo-300';
  if (grade.startsWith('C')) return 'bg-amber-100 text-amber-900 border-amber-300';
  return 'bg-rose-100 text-rose-900 border-rose-300';
};

export const InterviewEvaluationModal: React.FC<InterviewEvaluationModalProps> = ({
  student,
  currentUser,
  isOpen,
  onClose,
  onSave
}) => {
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
  const canPublish = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'OFFICER';

  // State for marks
  const [marksState, setMarksState] = useState<Record<string, number>>({});
  const [remarksState, setRemarksState] = useState<Record<string, string>>({});
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [recommendedRole, setRecommendedRole] = useState('Core Technical Specialist');
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize or hydrate from existing student.interviewEvaluation
  useEffect(() => {
    if (student.interviewEvaluation) {
      const evalData = student.interviewEvaluation;
      const initialMarks: Record<string, number> = {};
      const initialRemarks: Record<string, string> = {};

      DEFAULT_CRITERIA.forEach(c => {
        const found = evalData.criteria.find(item => item.id === c.id);
        initialMarks[c.id] = found ? found.awardedMarks : 0;
        initialRemarks[c.id] = found?.remarks || '';
      });

      setMarksState(initialMarks);
      setRemarksState(initialRemarks);
      setGeneralFeedback(evalData.generalFeedback || '');
      setStrengths(evalData.strengths || '');
      setAreasForImprovement(evalData.areasForImprovement || '');
      setRecommendedRole(evalData.recommendedRole || 'Core Technical Specialist');
      setIsPublished(evalData.isPublishedToStudent || false);
    } else {
      // Clean slate defaults
      const initialMarks: Record<string, number> = {};
      const initialRemarks: Record<string, string> = {};
      DEFAULT_CRITERIA.forEach(c => {
        initialMarks[c.id] = 0;
        initialRemarks[c.id] = '';
      });
      setMarksState(initialMarks);
      setRemarksState(initialRemarks);
      setGeneralFeedback('');
      setStrengths('');
      setAreasForImprovement('');
      setRecommendedRole('Core Technical Specialist');
      setIsPublished(false);
    }
    setFeedbackMsg(null);
  }, [student, isOpen]);

  if (!isOpen) return null;

  // Auto-calculated total and grade
  const totalScore = DEFAULT_CRITERIA.reduce((acc, c) => acc + (marksState[c.id] || 0), 0);
  const percentage = Math.round((totalScore / 100) * 100);
  const currentGrade = calculateGrade(totalScore);

  const handleMarkChange = (id: string, val: number, max: number) => {
    const cleanVal = isNaN(val) ? 0 : Math.max(0, Math.min(max, val));
    setMarksState(prev => ({ ...prev, [id]: cleanVal }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      const criteriaList: InterviewCriterionMark[] = DEFAULT_CRITERIA.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        maxMarks: c.maxMarks,
        awardedMarks: marksState[c.id] || 0,
        remarks: remarksState[c.id] || ''
      }));

      const now = new Date().toISOString();
      const updatedEvaluation: InterviewEvaluation = {
        id: student.interviewEvaluation?.id || `eval_${student.id}_${Date.now()}`,
        studentId: student.id,
        studentRegNo: student.registerNumber,
        studentName: student.name,
        evaluatedByUid: currentUser.uid,
        evaluatedByName: currentUser.name || 'Faculty Evaluator',
        evaluatorRole: currentUser.role,
        evaluatedAt: student.interviewEvaluation?.evaluatedAt || now,
        lastUpdatedAt: now,
        criteria: criteriaList,
        totalMarks: totalScore,
        maxTotalMarks: 100,
        percentage,
        grade: currentGrade,
        generalFeedback,
        strengths,
        areasForImprovement,
        recommendedRole,
        // Publish state: Admin and staff can toggle publish state
        isPublishedToStudent: canPublish ? isPublished : (student.interviewEvaluation?.isPublishedToStudent || false),
        publishedAt: isPublished ? (student.interviewEvaluation?.publishedAt || now) : undefined,
        publishedBy: isPublished ? (student.interviewEvaluation?.publishedBy || currentUser.name) : undefined
      };

      const updatedStudent: StudentProfile = {
        ...student,
        interviewEvaluation: updatedEvaluation
      };

      await onSave(updatedStudent);
      setFeedbackMsg({
        type: 'success',
        text: `Evaluation successfully saved! Total Score: ${totalScore}/100 (${currentGrade}).`
      });

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to save evaluation sheet.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                {student.profileImage ? (
                  <img
                    src={student.profileImage}
                    alt={student.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-400/80 shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-blue-800 text-teal-300 font-bold flex items-center justify-center text-lg border-2 border-teal-400/80 shadow-md">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 p-1 bg-purple-600 text-white rounded-lg shadow-sm">
                  <Award className="w-3.5 h-3.5" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-serif text-white tracking-wide">
                    {student.name}
                  </h3>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white/15 text-teal-200">
                    {student.registerNumber}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mt-1">
                  <span>{student.department}</span>
                  <span>•</span>
                  <span>{student.academicYear}</span>
                  <span>•</span>
                  <span className="text-teal-300 font-semibold">{student.club || 'General Member'}</span>
                </div>
              </div>
            </div>

            {/* Quick Live Score Dial */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 px-5 text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                Total Score
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black text-teal-300 font-mono">
                  {totalScore}
                </span>
                <span className="text-xs text-slate-300 font-semibold">/ 100</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${getGradeBadgeColor(currentGrade)}`}>
                {currentGrade}
              </span>
            </div>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {feedbackMsg && (
          <div className={`px-5 py-3 text-xs font-semibold flex items-center gap-2 ${
            feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'
          }`}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">

          {/* Privacy & Confidentiality Notice + Admin Publish Toggle */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-serif">
                    Confidentiality & Student Dashboard Visibility
                  </h4>
                  {isPublished ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1">
                      <Eye className="w-3 h-3 text-emerald-600" /> Visible to Student
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 rounded-full flex items-center gap-1">
                      <EyeOff className="w-3 h-3 text-amber-700" /> Private (Staff/Admin Only)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  By default, interview marks are confidential and only visible within staff and admin consoles. 
                  As a staff member or administrator, you can toggle the button to publish or hide this scorecard on the student's dashboard.
                </p>
              </div>

              {/* STAFF & ADMIN ONE-CLICK TOGGLE BUTTON */}
              {canPublish ? (
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 ${
                    isPublished
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                  title={isPublished ? 'Click to make marks private' : 'Click to show marks to student'}
                >
                  {isPublished ? (
                    <>
                      <Eye className="w-4 h-4 text-emerald-100" />
                      <span>Marks Published to Student</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-slate-500" />
                      <span>Show Marks to Student</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="text-[11px] text-slate-400 italic bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  {student.interviewEvaluation?.isPublishedToStudent ? '✅ Published' : '🔒 Staff or Admin permission required'}
                </div>
              )}
            </div>
          </div>

          {/* 6 EVALUATION CATEGORIES (Total 100 Marks) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 font-serif flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-700" />
                  1-to-1 Interview Evaluation Rubric (100 Marks)
                </h4>
                <p className="text-xs text-slate-500">
                  Assess the candidate across the 6 standardized competency categories. Marks sum automatically.
                </p>
              </div>
              <div className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                Sum: {totalScore} / 100
              </div>
            </div>

            <div className="space-y-4">
              {DEFAULT_CRITERIA.map((criterion, idx) => {
                const currentVal = marksState[criterion.id] ?? 0;
                const ratio = Math.round((currentVal / criterion.maxMarks) * 100);

                return (
                  <div 
                    key={criterion.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {criterion.name}
                          </span>
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            Max: {criterion.maxMarks} Marks
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 pl-7">
                          {criterion.description}
                        </p>
                      </div>

                      {/* Marks Input & Quick Presets */}
                      <div className="flex items-center gap-2 pl-7 sm:pl-0">
                        <input
                          type="number"
                          min={0}
                          max={criterion.maxMarks}
                          value={currentVal}
                          onChange={e => handleMarkChange(criterion.id, parseInt(e.target.value, 10), criterion.maxMarks)}
                          className="w-20 px-3 py-1.5 text-center font-mono font-bold text-sm text-blue-950 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                        <span className="text-xs font-semibold text-slate-400">/ {criterion.maxMarks}</span>

                        {/* Quick Presets */}
                        <div className="hidden sm:flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={() => handleMarkChange(criterion.id, Math.round(criterion.maxMarks * 0.5), criterion.maxMarks)}
                            className="px-2 py-1 text-[10px] font-bold rounded bg-slate-200/80 hover:bg-slate-300 text-slate-700 cursor-pointer"
                            title="Set 50%"
                          >
                            50%
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkChange(criterion.id, Math.round(criterion.maxMarks * 0.8), criterion.maxMarks)}
                            className="px-2 py-1 text-[10px] font-bold rounded bg-slate-200/80 hover:bg-slate-300 text-slate-700 cursor-pointer"
                            title="Set 80%"
                          >
                            80%
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkChange(criterion.id, criterion.maxMarks, criterion.maxMarks)}
                            className="px-2 py-1 text-[10px] font-bold rounded bg-teal-100 hover:bg-teal-200 text-teal-900 cursor-pointer"
                            title="Set 100% Full Marks"
                          >
                            Full
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar + Optional Category Remark */}
                    <div className="pl-7 space-y-2">
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            ratio >= 80 ? 'bg-emerald-500' : ratio >= 50 ? 'bg-blue-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Specific observation or remark for this criterion (optional)..."
                        value={remarksState[criterion.id] || ''}
                        onChange={e => setRemarksState({ ...remarksState, [criterion.id]: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EVALUATOR OBSERVATIONS & ROLE RECOMMENDATION */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 font-serif flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-700" />
              Qualitative Feedback & Squad Role Recommendation
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recommended Project Squad Role:
                </label>
                <select
                  value={recommendedRole}
                  onChange={e => setRecommendedRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Team Leader & Coordinator">Team Leader & Coordinator</option>
                  <option value="Core Technical Specialist">Core Technical Specialist</option>
                  <option value="Hardware & Structural Prototyper">Hardware & Structural Prototyper</option>
                  <option value="Software & AI/IoT Developer">Software & AI/IoT Developer</option>
                  <option value="Research & Documentation Lead">Research & Documentation Lead</option>
                  <option value="Presentation & Pitching Specialist">Presentation & Pitching Specialist</option>
                  <option value="Logistics & Event Operations">Logistics & Event Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Key Strengths Noted:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excellent AutoCAD fluency, clear voice, confident leader"
                  value={strengths}
                  onChange={e => setStrengths(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Areas for Growth & Guidance:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Needs exposure to structural analysis software, practice technical Q&A"
                  value={areasForImprovement}
                  onChange={e => setAreasForImprovement(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Overall Interview Feedback:
                </label>
                <textarea
                  rows={2}
                  placeholder="Comprehensive review summary for faculty and selection committee..."
                  value={generalFeedback}
                  onChange={e => setGeneralFeedback(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900"
                />
              </div>
            </div>

            {/* Evaluator Stamp */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-700" />
                Evaluator: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.role})
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Session Date: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-white border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            Total Awarded: <strong className="text-blue-950 font-bold">{totalScore} / 100</strong> • Grade: <strong className="text-emerald-700 font-bold">{currentGrade}</strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-1/2 sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-1/2 sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Sheet...' : 'Save Evaluation'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
