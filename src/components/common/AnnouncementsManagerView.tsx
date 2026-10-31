import React, { useState } from 'react';
import { 
  UserAccount, 
  Announcement 
} from '../../types';
import { storageService } from '../../services/storageService';
import { cloudinaryService } from '../../services/cloudinaryService';
import { 
  Bell, 
  Plus, 
  Search, 
  Trash2, 
  UploadCloud, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Tag, 
  Clock, 
  Image as ImageIcon,
  Sparkles,
  Award,
  BookOpen,
  Calendar,
  Layers,
  X
} from 'lucide-react';

interface AnnouncementsManagerViewProps {
  currentUser: UserAccount;
  announcements: Announcement[];
  onRefreshData: () => void;
  roleLabel?: string;
}

const CATEGORIES = [
  'Event',
  'Quiz',
  'Competition',
  'Hackathon',
  'Workshop',
  'Congratulations',
  'Circular',
  'General',
  'Administrative'
] as const;

export const AnnouncementsManagerView: React.FC<AnnouncementsManagerViewProps> = ({
  currentUser,
  announcements,
  onRefreshData,
  roleLabel = 'Faculty Officer'
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('Event');
  const [description, setDescription] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [posterUrl, setPosterUrl] = useState<string>('');
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const handlePosterSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPoster(true);
    try {
      const res = await cloudinaryService.uploadProfileImage(file, `announcement-${Date.now()}`);
      if (res.success && res.imageUrl) {
        setPosterUrl(res.imageUrl);
      } else {
        alert(res.message || 'Failed to upload poster image');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload image.');
    } finally {
      setIsUploadingPoster(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsPublishing(true);
    setSuccessMessage(null);

    try {
      const newAnnouncement: Announcement = {
        id: `ann-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        category,
        isImportant,
        publishedBy: `${currentUser.name} (${roleLabel})`,
        publisherRole: currentUser.role,
        publishedAt: new Date().toISOString(),
        attachmentUrl: posterUrl.trim() || undefined,
        linkText: linkText.trim() || (linkUrl.trim() ? 'Learn More' : undefined),
        isActive: true
      };

      // Also set external link if provided without poster
      if (linkUrl.trim() && !posterUrl.trim()) {
        newAnnouncement.attachmentUrl = linkUrl.trim();
      }

      await storageService.saveAnnouncement(newAnnouncement);

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('Event');
      setIsImportant(false);
      setLinkUrl('');
      setLinkText('');
      setPosterUrl('');
      setSuccessMessage('Announcement published successfully! All students and staff can now view it.');

      onRefreshData();

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to publish announcement.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (id: string, annTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${annTitle}"? It will be removed from all student dashboards.`)) {
      await storageService.deleteAnnouncement(id);
      onRefreshData();
    }
  };

  const filteredAnnouncements = announcements.filter(ann => {
    const matchesCategory = filterCategory === 'All' || ann.category === filterCategory;
    const matchesSearch = 
      ann.title.toLowerCase().includes(search.toLowerCase()) ||
      ann.description.toLowerCase().includes(search.toLowerCase()) ||
      ann.publishedBy.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch && ann.isActive;
  });

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

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-blue-800" />
              Department Announcement Broadcast Console
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-blue-950 font-serif mt-2">
            Announcements, Events & Opportunities
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Publish quizzes, symposium events, hackathons, workshop notices, and congratulations directly to all student dashboards.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
            {announcements.length} Live Broadcast(s)
          </span>
        </div>
      </div>

      {/* Main Grid: Publish Form (Left) & Published List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PUBLISH FORM (5 COLS) */}
        <div className="lg:col-span-5">
          <form 
            onSubmit={handlePublish}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs sticky top-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-blue-950 font-serif flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-800" />
                Create New Broadcast Notice
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                By {currentUser.name}
              </span>
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Announcement Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notice / Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. National Level Quiz Competition 2026 or Congratulations Winners!"
                className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-800"
                required
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Announcement Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-800 cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'Quiz' ? '🧠 Quiz Competition' :
                     cat === 'Event' ? '🎪 College / Department Event' :
                     cat === 'Congratulations' ? '🎉 Congratulations & Achievements' :
                     cat === 'Competition' ? '🏆 Technical Competition' :
                     cat === 'Hackathon' ? '💻 Hackathon & Coding Contest' :
                     cat === 'Workshop' ? '🛠️ Hands-on Workshop' :
                     cat === 'Circular' ? '📜 Official Circular / Memo' :
                     cat === 'Administrative' ? '🏛️ Administrative Notice' :
                     '📢 General Announcement'}
                  </option>
                ))}
              </select>
            </div>

            {/* Complete Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Description / Agenda <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Provide detailed information regarding date, venue, syllabus, eligibility, prizes, or congratulations note..."
                className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-800"
                required
              />
            </div>

            {/* Poster / Flyer Image Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Attach Poster / Event Flyer (Optional)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer font-semibold transition-colors">
                  <UploadCloud className="w-4 h-4 text-blue-700" />
                  <span>{isUploadingPoster ? 'Uploading...' : posterUrl ? 'Change Flyer Image' : 'Browse Flyer Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterSelect}
                    className="hidden"
                    disabled={isUploadingPoster}
                  />
                </label>
                {posterUrl && (
                  <button
                    type="button"
                    onClick={() => setPosterUrl('')}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                    title="Remove poster"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {posterUrl && (
                <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-100">
                  <img src={posterUrl} alt="Poster preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* External Link & Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  External URL (Optional)
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Button Label
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={e => setLinkText(e.target.value)}
                  placeholder="e.g. Register / Details"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Mark as Important Checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl font-bold text-amber-950">
              <input
                type="checkbox"
                checked={isImportant}
                onChange={e => setIsImportant(e.target.checked)}
                className="rounded text-amber-700 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs">Highlight as High-Priority Notice (Red Banner Alert)</span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPublishing || isUploadingPoster}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4 text-teal-300" />
              <span>{isPublishing ? 'Broadcasting Announcement...' : 'Publish Announcement Now'}</span>
            </button>
          </form>
        </div>

        {/* PUBLISHED NOTICES STREAM (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notices by title, publisher or keywords..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-800"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setFilterCategory('All')}
                className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                  filterCategory === 'All'
                    ? 'bg-blue-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({announcements.length})
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
                    filterCategory === cat
                      ? 'bg-blue-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
              <Bell className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No Announcements Found</h4>
              <p className="text-xs text-slate-400">Create a new broadcast using the form on the left.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map(ann => (
                <div
                  key={ann.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs space-y-3 transition-all hover:shadow-md ${
                    ann.isImportant
                      ? 'border-amber-300 bg-linear-to-b from-amber-50/20 to-white'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Top Bar: Category & Priority */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadgeClass(ann.category)}`}>
                        {ann.category}
                      </span>
                      {ann.isImportant && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                          High-Priority Alert
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(ann.id, ann.title)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                      {ann.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1.5 whitespace-pre-line">
                      {ann.description}
                    </p>
                  </div>

                  {/* Poster preview if attached */}
                  {ann.attachmentUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-slate-50">
                      <img 
                        src={ann.attachmentUrl} 
                        alt={ann.title} 
                        className="w-full h-full object-contain max-h-56" 
                      />
                    </div>
                  )}

                  {/* Link action if available */}
                  {ann.attachmentUrl && ann.linkText && (
                    <div>
                      <a
                        href={ann.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-800 hover:text-blue-950 underline decoration-blue-300"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {ann.linkText}
                      </a>
                    </div>
                  )}

                  {/* Footer: Publisher & Date */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
