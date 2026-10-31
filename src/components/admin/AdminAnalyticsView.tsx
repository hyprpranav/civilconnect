import React, { useState, useMemo } from 'react';
import { StudentProfile, ALL_DEPARTMENTS } from '../../types';
import { 
  BarChart3, 
  PieChart,
  Sparkles, 
  Compass, 
  Truck, 
  Users, 
  Search, 
  Eye, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Filter, 
  Layers, 
  Calendar,
  X,
  ChevronRight,
  Info
} from 'lucide-react';

interface AdminAnalyticsViewProps {
  students: StudentProfile[];
  onOpenAirProfileCard: (student: StudentProfile) => void;
  titlePrefix?: string;
}

interface DrilldownFilter {
  type: 'department' | 'complexity' | 'year' | 'skill' | 'activity' | 'role' | 'logistics' | 'all';
  value: string;
  label: string;
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({
  students,
  onOpenAirProfileCard,
  titlePrefix = 'Executive'
}) => {
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [drilldown, setDrilldown] = useState<DrilldownFilter | null>(null);
  const [searchDrilldown, setSearchDrilldown] = useState('');
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  // Filter students based on year filter
  const activeCohort = useMemo(() => {
    return students.filter(s => {
      if (yearFilter === 'All') return true;
      return s.academicYear === yearFilter;
    });
  }, [students, yearFilter]);

  const total = activeCohort.length || 1;

  // 1. Department Breakdown (All 12 departments + others)
  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeCohort.forEach(s => {
      const dept = s.department || 'Civil Engineering';
      counts[dept] = (counts[dept] || 0) + 1;
    });

    const palette = [
      '#1e40af', '#0284c7', '#0d9488', '#059669', 
      '#6366f1', '#8b5cf6', '#d946ef', '#f59e0b', 
      '#ea580c', '#e11d48', '#475569', '#14b8a6'
    ];

    return Object.keys(counts)
      .map((dept, idx) => ({
        name: dept,
        count: counts[dept],
        percent: Math.round((counts[dept] / total) * 100),
        color: palette[idx % palette.length]
      }))
      .sort((a, b) => b.count - a.count);
  }, [activeCohort, total]);

  // 2. Complexity / Depth Tier Breakdown
  const complexityData = useMemo(() => {
    let advanced = 0;
    let intermediate = 0;
    let foundational = 0;

    activeCohort.forEach(s => {
      const skillCount = s.skills?.strongestSkills?.length || 0;
      const hasHackathon = s.teamPreferences?.participatedInHackathon || s.interests?.activities?.includes('Hackathon Participation');
      const hasProject = s.teamPreferences?.developedTechnicalProject || s.interests?.activities?.includes('Project Development');

      if (skillCount >= 5 || (hasHackathon && hasProject)) {
        advanced++;
      } else if (skillCount >= 3 || hasHackathon || hasProject) {
        intermediate++;
      } else {
        foundational++;
      }
    });

    return [
      {
        name: 'Advanced Tier (High Depth)',
        key: 'Advanced',
        description: '5+ Core Skills / Hackathon & Project Experienced',
        count: advanced,
        percent: Math.round((advanced / total) * 100),
        color: '#0d9488' // Teal 600
      },
      {
        name: 'Intermediate Tier (Specialized)',
        key: 'Intermediate',
        description: '3-4 Skills / Active Event & Workshop Intent',
        count: intermediate,
        percent: Math.round((intermediate / total) * 100),
        color: '#2563eb' // Blue 600
      },
      {
        name: 'Foundational Tier (Building)',
        key: 'Foundational',
        description: '1-2 Skills / Early Stage Competency',
        count: foundational,
        percent: Math.round((foundational / total) * 100),
        color: '#f59e0b' // Amber 500
      }
    ];
  }, [activeCohort, total]);

  // 3. Academic Year Breakdown
  const yearData = useMemo(() => {
    const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    return years.map(y => {
      const count = activeCohort.filter(s => s.academicYear === y).length;
      return {
        name: y,
        count,
        percent: Math.round((count / total) * 100)
      };
    });
  }, [activeCohort, total]);

  // 4. Core Skills
  const SKILL_LIST = [
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

  const skillCounts = useMemo(() => {
    return SKILL_LIST.map(skill => {
      const count = activeCohort.filter(s => s.skills?.strongestSkills?.includes(skill)).length;
      return {
        name: skill,
        count,
        percent: Math.round((count / total) * 100)
      };
    }).sort((a, b) => b.count - a.count);
  }, [activeCohort, total]);

  // 5. Activities & Focus Areas
  const ACTIVITY_LIST = [
    'Hackathon Participation',
    'Project Development',
    'Workshops and Technical Training',
    'Club and Association Activities',
    'Event Hosting and Coordination',
    'Event Committee Organization',
    'Startup and Entrepreneurship',
    'Research and Development',
    'MSME / Government Scheme Applications',
    'Hackathon Organization'
  ];

  const activityCounts = useMemo(() => {
    return ACTIVITY_LIST.map(act => {
      const count = activeCohort.filter(s => s.interests?.activities?.includes(act)).length;
      return {
        name: act,
        count,
        percent: Math.round((count / total) * 100)
      };
    }).sort((a, b) => b.count - a.count);
  }, [activeCohort, total]);

  // 6. Technical Roles
  const TECH_ROLES = [
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

  const roleCounts = useMemo(() => {
    return TECH_ROLES.map(role => {
      const count = activeCohort.filter(s => s.teamStrengths?.roles?.includes(role)).length;
      return {
        name: role,
        count,
        percent: Math.round((count / total) * 100)
      };
    }).sort((a, b) => b.count - a.count);
  }, [activeCohort, total]);

  // 7. Logistics
  const LOGISTICS_LIST = [
    'Travel Planning',
    'Ticket Booking',
    'Accommodation / Room Booking',
    'Route Planning',
    'Event Logistics',
    'Budget Planning',
    'Resource Management',
    'External Communication'
  ];

  const logisticsCounts = useMemo(() => {
    return LOGISTICS_LIST.map(item => {
      const count = activeCohort.filter(s => s.teamStrengths?.logisticsSkills?.includes(item)).length;
      return {
        name: item,
        count,
        percent: Math.round((count / total) * 100)
      };
    }).sort((a, b) => b.count - a.count);
  }, [activeCohort, total]);

  // Filter students based on active drilldown selection
  const drilldownStudents = useMemo(() => {
    let result = activeCohort;

    if (drilldown) {
      if (drilldown.type === 'department') {
        result = result.filter(s => s.department === drilldown.value);
      } else if (drilldown.type === 'year') {
        result = result.filter(s => s.academicYear === drilldown.value);
      } else if (drilldown.type === 'skill') {
        result = result.filter(s => s.skills?.strongestSkills?.includes(drilldown.value));
      } else if (drilldown.type === 'activity') {
        result = result.filter(s => s.interests?.activities?.includes(drilldown.value));
      } else if (drilldown.type === 'role') {
        result = result.filter(s => s.teamStrengths?.roles?.includes(drilldown.value));
      } else if (drilldown.type === 'logistics') {
        result = result.filter(s => s.teamStrengths?.logisticsSkills?.includes(drilldown.value));
      } else if (drilldown.type === 'complexity') {
        if (drilldown.value === 'Advanced') {
          result = result.filter(s => {
            const skillCount = s.skills?.strongestSkills?.length || 0;
            const hasH = s.teamPreferences?.participatedInHackathon || s.interests?.activities?.includes('Hackathon Participation');
            const hasP = s.teamPreferences?.developedTechnicalProject || s.interests?.activities?.includes('Project Development');
            return skillCount >= 5 || (hasH && hasP);
          });
        } else if (drilldown.value === 'Intermediate') {
          result = result.filter(s => {
            const skillCount = s.skills?.strongestSkills?.length || 0;
            const hasH = s.teamPreferences?.participatedInHackathon || s.interests?.activities?.includes('Hackathon Participation');
            const hasP = s.teamPreferences?.developedTechnicalProject || s.interests?.activities?.includes('Project Development');
            return (skillCount >= 3 || hasH || hasP) && !(skillCount >= 5 || (hasH && hasP));
          });
        } else {
          result = result.filter(s => {
            const skillCount = s.skills?.strongestSkills?.length || 0;
            const hasH = s.teamPreferences?.participatedInHackathon || s.interests?.activities?.includes('Hackathon Participation');
            const hasP = s.teamPreferences?.developedTechnicalProject || s.interests?.activities?.includes('Project Development');
            return skillCount < 3 && !hasH && !hasP;
          });
        }
      }
    }

    if (searchDrilldown.trim()) {
      const q = searchDrilldown.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.registerNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [activeCohort, drilldown, searchDrilldown]);

  // Helper to render interactive SVG Pie / Donut Chart
  const renderDonutChart = (
    data: { name: string; count: number; percent: number; color: string; key?: string }[],
    type: 'department' | 'complexity'
  ) => {
    let cumulativePercent = 0;
    const size = 200;
    const center = size / 2;
    const radius = 70;
    const strokeWidth = 32;

    const circumference = 2 * Math.PI * radius;

    return (
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* SVG Donut */}
        <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />
            {data.map((item, idx) => {
              if (item.percent <= 0) return null;
              const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += item.percent;

              const isSelected = drilldown?.type === type && (drilldown.value === (item.key || item.name));
              const isHovered = hoveredSlice === item.name;

              return (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isSelected || isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer hover:opacity-90"
                  onMouseEnter={() => setHoveredSlice(item.name)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  onClick={() => {
                    setDrilldown({
                      type,
                      value: item.key || item.name,
                      label: `${type === 'department' ? 'Department' : 'Complexity'}: ${item.name}`
                    });
                  }}
                />
              );
            })}
          </svg>

          {/* Donut Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-xl font-extrabold text-slate-900 leading-none">
              {total}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Students
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {data.map((item, idx) => {
            const isSelected = drilldown?.type === type && (drilldown.value === (item.key || item.name));
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDrilldown({
                    type,
                    value: item.key || item.name,
                    label: `${type === 'department' ? 'Department' : 'Complexity'}: ${item.name}`
                  });
                }}
                className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border transition-all text-left cursor-pointer ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50/70 font-bold' 
                    : 'border-transparent hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <span className="truncate text-slate-800">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                  <span className="font-bold text-slate-900">{item.count}</span>
                  <span className="text-slate-400">({item.percent}%)</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
              {titlePrefix} Analytics
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-mono">Real-Time Cohort Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-950 font-serif mt-1">
            Talent & Academic Distribution Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Interactive visual charts covering all departments, complexity tiers, year groups, skills, and student lists.
          </p>
        </div>

        {/* Year Filter Switcher */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter Year:</span>
          <select
            value={yearFilter}
            onChange={e => {
              setYearFilter(e.target.value);
              setDrilldown(null);
            }}
            className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl bg-white shadow-2xs cursor-pointer"
          >
            <option value="All">All Academic Years</option>
            <option value="1st Year">1st Year Only</option>
            <option value="2nd Year">2nd Year Only</option>
            <option value="3rd Year">3rd Year Only</option>
            <option value="4th Year">4th Year Only</option>
          </select>
        </div>
      </div>

      {/* SECTION 1: PIE CHARTS & YEAR BARS (The new requested visualizations) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PIE CHART 1: DEPARTMENT BREAKDOWN */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" />
                Department Breakdown (Percentage & Headcount)
              </h3>
              <p className="text-[11px] text-slate-500">Touch/Click any slice to reveal enrolled students below</p>
            </div>
            <span className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {deptData.length} Departments
            </span>
          </div>

          {renderDonutChart(deptData, 'department')}
        </div>

        {/* PIE CHART 2: COMPLEXITY TIERS (User requested: "Pi represents for complexity you just have some complexity inside And while touching on that the student list also should shown") */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Skill Complexity & Experience Distribution
              </h3>
              <p className="text-[11px] text-slate-500">Categorized by skill volume, hackathons, and technical projects</p>
            </div>
            <span className="text-[11px] font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              3 Complexity Tiers
            </span>
          </div>

          {renderDonutChart(complexityData, 'complexity')}
        </div>
      </div>

      {/* ACADEMIC YEAR BAR CHART (User requested: "I just need which year they have put an bar chart representation") */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Academic Year Representation Bar Chart
            </h3>
            <p className="text-[11px] text-slate-500">Student enrollment and talent distribution across study years</p>
          </div>
          <span className="text-[11px] font-bold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            1st to 4th Year
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
          {yearData.map(item => {
            const isSelected = drilldown?.type === 'year' && drilldown.value === item.name;
            return (
              <div
                key={item.name}
                onClick={() => {
                  setDrilldown({
                    type: 'year',
                    value: item.name,
                    label: `Academic Year: ${item.name}`
                  });
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  isSelected 
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs' 
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{item.name}</span>
                  <span className="text-xs font-bold text-indigo-900 font-mono">
                    {item.count} <span className="text-slate-400 font-normal">({item.percent}%)</span>
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-full transition-all duration-500"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 text-center font-medium">Click to filter year students</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: 4 SKILL, ACTIVITY, ROLES & LOGISTICS BAR CHARTS (With Click-to-Drilldown) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: 10 CORE SKILLS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-700" />
                10 Core Skills Distribution Bar Graph
              </h3>
              <p className="text-[11px] text-slate-500">Click any skill to display possessing students below</p>
            </div>
            <span className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Interactive
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {skillCounts.map(item => {
              const isSelected = drilldown?.type === 'skill' && drilldown.value === item.name;
              return (
                <div 
                  key={item.name} 
                  onClick={() => setDrilldown({ type: 'skill', value: item.name, label: `Core Skill: ${item.name}` })}
                  className={`p-2 rounded-xl border transition-all cursor-pointer space-y-1 ${
                    isSelected ? 'border-blue-600 bg-blue-50/70' : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="font-bold text-blue-900 font-mono">
                      {item.count} students <span className="text-slate-400 font-normal">({item.percent}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex items-center">
                    <div
                      className="h-full bg-gradient-to-r from-blue-700 to-blue-900 rounded-full transition-all duration-500"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 2: ACTIVITIES & FOCUS AREAS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-700" />
                Activities & Focus Areas Distribution
              </h3>
              <p className="text-[11px] text-slate-500">Click any focus area to filter participating students</p>
            </div>
            <span className="text-[11px] font-bold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Interactive
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {activityCounts.map(item => {
              const isSelected = drilldown?.type === 'activity' && drilldown.value === item.name;
              return (
                <div 
                  key={item.name} 
                  onClick={() => setDrilldown({ type: 'activity', value: item.name, label: `Activity: ${item.name}` })}
                  className={`p-2 rounded-xl border transition-all cursor-pointer space-y-1 ${
                    isSelected ? 'border-teal-600 bg-teal-50/70' : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="font-bold text-teal-900 font-mono">
                      {item.count} students <span className="text-slate-400 font-normal">({item.percent}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex items-center">
                    <div
                      className="h-full bg-gradient-to-r from-teal-600 to-teal-800 rounded-full transition-all duration-500"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 3: TECHNICAL ROLES */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-700" />
                Team Role Contributions Breakdown
              </h3>
              <p className="text-[11px] text-slate-500">Click any role to see candidate squad leaders & engineers</p>
            </div>
            <span className="text-[11px] font-bold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Interactive
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {roleCounts.map(item => {
              const isSelected = drilldown?.type === 'role' && drilldown.value === item.name;
              return (
                <div 
                  key={item.name} 
                  onClick={() => setDrilldown({ type: 'role', value: item.name, label: `Role: ${item.name}` })}
                  className={`p-2 rounded-xl border transition-all cursor-pointer space-y-1 ${
                    isSelected ? 'border-indigo-600 bg-indigo-50/70' : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="font-bold text-indigo-900 font-mono">
                      {item.count} students <span className="text-slate-400 font-normal">({item.percent}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex items-center">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-full transition-all duration-500"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 4: LOGISTICS & OPERATIONS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-700" />
                Logistics & Operations Strengths
              </h3>
              <p className="text-[11px] text-slate-500">Click any capability to identify support logistics talent</p>
            </div>
            <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Interactive
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {logisticsCounts.map(item => {
              const isSelected = drilldown?.type === 'logistics' && drilldown.value === item.name;
              return (
                <div 
                  key={item.name} 
                  onClick={() => setDrilldown({ type: 'logistics', value: item.name, label: `Logistics: ${item.name}` })}
                  className={`p-2 rounded-xl border transition-all cursor-pointer space-y-1 ${
                    isSelected ? 'border-amber-600 bg-amber-50/70' : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="font-bold text-amber-900 font-mono">
                      {item.count} students <span className="text-slate-400 font-normal">({item.percent}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex items-center">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-700 rounded-full transition-all duration-500"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* SECTION 3: INTERACTIVE STUDENT DRILLDOWN LIST (The requested touch-to-view student list) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-700" />
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Cohort Student Drilldown Explorer
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {drilldown 
                ? `Filtered by: ${drilldown.label} (${drilldownStudents.length} matching students)`
                : `Showing all active cohort students (${drilldownStudents.length} students). Touch any chart above to filter.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {drilldown && (
              <button
                onClick={() => setDrilldown(null)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Clear Filter
              </button>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchDrilldown}
                onChange={e => setSearchDrilldown(e.target.value)}
                placeholder="Search filtered students..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl w-48 sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Active Filter Pill */}
        {drilldown && (
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
            <span className="font-semibold">
              🎯 Active Selection: <strong>{drilldown.label}</strong>
            </span>
            <span className="font-mono font-bold text-xs">
              {drilldownStudents.length} Students found
            </span>
          </div>
        )}

        {/* Drilldown Table */}
        <div className="overflow-x-auto -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Register No.</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3">Key Skills</th>
                <th className="py-2.5 px-3">Completion</th>
                <th className="py-2.5 px-3 text-right">Air Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drilldownStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No students match the current filter selection.
                  </td>
                </tr>
              ) : (
                drilldownStudents.slice(0, 30).map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden">
                        {s.profileImage ? (
                          <img src={s.profileImage} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                          s.name.charAt(0)
                        )}
                      </div>
                      <span className="truncate max-w-[160px]">{s.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 font-medium">
                      {s.registerNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {s.department}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {s.academicYear}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {s.skills?.strongestSkills?.slice(0, 2).map(sk => (
                          <span key={sk} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px]">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      {s.profileCompletionPercentage}%
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onOpenAirProfileCard(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {drilldownStudents.length > 30 && (
            <p className="text-[11px] text-slate-400 text-center pt-3">
              Showing top 30 of {drilldownStudents.length} matching students. Use search bar to refine.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
