import React, { useState } from 'react';
import { Announcement } from '../../types';
import { 
  Bell, 
  Calendar, 
  ExternalLink, 
  AlertTriangle, 
  Search, 
  Filter,
  Tag,
  Clock
} from 'lucide-react';

interface StudentUpdatesTabProps {
  announcements: Announcement[];
}

export const StudentUpdatesTab: React.FC<StudentUpdatesTabProps> = ({ announcements }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Event',
    'Quiz',
    'Competition',
    'Hackathon',
    'Workshop',
    'Congratulations',
    'Circular',
    'Administrative',
    'General'
  ];

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'Quiz':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Event':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'Congratulations':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Competition':
      case 'Hackathon':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Workshop':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'Circular':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      default:
        return 'bg-blue-100 text-blue-900 border-blue-200';
    }
  };

  const filtered = announcements.filter(ann => {
    const matchesCategory = selectedCategory === 'All' || ann.category === selectedCategory;
    const matchesSearch = 
      ann.title.toLowerCase().includes(search.toLowerCase()) ||
      ann.description.toLowerCase().includes(search.toLowerCase()) ||
      ann.publishedBy.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch && ann.isActive;
  });

  return (
    <div className="space-y-6">
      {/* Header and Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-800" />
              College Notices, Competitions & Opportunities
            </h2>
            <p className="text-xs text-slate-500">
              Stay informed with department announcements, technical workshops, quizzes, and hackathon schedules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
              {filtered.length} active notice(s)
            </span>
          </div>
        </div>

        {/* Search & Category Pills */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search announcements by title, publisher or keywords..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-800"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Announcements Found</h4>
            <p className="text-xs text-slate-400">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          filtered.map(ann => (
            <div
              key={ann.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs space-y-3 transition-all hover:shadow-md ${
                ann.isImportant
                  ? 'border-amber-300 bg-linear-to-b from-amber-50/30 to-white'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadgeClass(ann.category)}`}>
                  {ann.category}
                </span>

                {ann.isImportant && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3 text-amber-700" />
                    Important Notice
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {ann.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-1.5 whitespace-pre-line">
                  {ann.description}
                </p>
              </div>

              {ann.attachmentUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-slate-50">
                  <img 
                    src={ann.attachmentUrl} 
                    alt={ann.title} 
                    className="w-full h-full object-contain max-h-56" 
                  />
                </div>
              )}

              {ann.attachmentUrl && ann.linkText && (
                <div className="pt-2">
                  <a
                    href={ann.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 hover:text-blue-950 underline decoration-blue-300"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {ann.linkText}
                  </a>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(ann.publishedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                <span className="font-semibold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200">
                  Published by: {ann.publishedBy}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
