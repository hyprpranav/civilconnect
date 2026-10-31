import React from 'react';
import { 
  Building2, 
  ArrowRight, 
  Users, 
  BarChart3, 
  Sparkles,
  UserPlus,
  ShieldCheck,
  Mail,
  Phone
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: (initialMode?: 'signin' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin
}) => {
  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs overflow-hidden p-0.5 border border-slate-200">
              <img src="/ici-logo.jpg" alt="CIVIL CONNECT - ICI Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                CIVIL CONNECT
              </h1>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                Centralized Engineering Talent & Cohort Network
              </p>
            </div>
          </div>

          {/* Clean 2-Button Action Corner */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenLogin('signup')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Request Account</span>
            </button>

            <button
              onClick={() => onOpenLogin('signin')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Centralized Student Intelligence & Inter-Departmental Collaboration</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-tight font-sans">
            CIVIL CONNECT
          </h2>

          <p className="text-lg sm:text-xl font-medium text-blue-700 tracking-tight">
            Connecting Students • Discovering Skills • Building Competition Teams
          </p>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A high-efficiency talent intelligence platform for engineering departments. Document professional competencies, capture interest areas, track verification status, and form balanced project teams.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onOpenLogin('signin')}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenLogin('signup')}
              className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-sm font-bold shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>Request Staff / Student Access</span>
            </button>
          </div>

          {/* Value Proposition Cards */}
          <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">12+ Engineering Departments</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Seamless multi-department directory covering Civil, Mechanical, ECE, VLSI, CSE, CSBS, IT, AI&DS, AIML, MBA, and MCA.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Real-Time Interactive Analytics</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Department and complexity pie charts with year representation bar graphs and instant student drilldown exploration.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Intelligent Team Engine</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Balanced squad generator algorithm matching coders, hardware builders, designers, and pitch leaders for hackathons.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-700">
          <span>CIVIL CONNECT</span>
          <span>•</span>
          <span className="font-bold text-slate-900">Crafted by Harish Pranav S</span>
          <span>•</span>
          <a href="mailto:hyprpranav@gmail.com" className="inline-flex items-center gap-1 text-blue-700 hover:underline">
            <Mail className="w-3.5 h-3.5" /> hyprpranav@gmail.com
          </a>
          <span>•</span>
          <span className="inline-flex items-center gap-1 text-slate-700 font-mono font-bold">
            <Phone className="w-3.5 h-3.5" /> 784-569-3765
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          © {new Date().getFullYear()} Civil Connect Platform • All Rights Reserved
        </p>
      </footer>
    </div>
  );
};
