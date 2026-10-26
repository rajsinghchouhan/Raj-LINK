import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  ArrowRightLeft, 
  Sparkles, 
  RefreshCw, 
  SlidersHorizontal,
  ExternalLink,
  Layers,
  Smartphone,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Check,
  CheckSquare,
  Play,
  Pause,
  Trash2,
  X
} from 'lucide-react';
import { RedirectLink, RedirectMode, AggregateStats } from './types/link';
import { filterLinks, calculateAggregateStats, batchUpdateStatus, batchDeleteLinks } from './utils/redirectLogic';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { LinkCard } from './components/LinkCard';
import { CreateEditLinkModal } from './components/CreateEditLinkModal';
import { QrCodeModal } from './components/QrCodeModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { PreviewSimulatorModal } from './components/PreviewSimulatorModal';
import { GlobalStatsModal } from './components/GlobalStatsModal';

export default function App() {
  const [links, setLinks] = useState<RedirectLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');

  // English by default; only changes to Hindi when user explicitly toggles
  const [lang, setLang] = useState<'en' | 'hi'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('switchlink_lang');
      if (saved === 'hi' || saved === 'en') return saved;
    }
    return 'en';
  });

  const toggleLanguage = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('switchlink_lang', next);
    }
  };

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [linkToEdit, setLinkToEdit] = useState<RedirectLink | null>(null);
  const [linkForQr, setLinkForQr] = useState<RedirectLink | null>(null);
  const [linkForAnalytics, setLinkForAnalytics] = useState<RedirectLink | null>(null);
  const [linkForSimulator, setLinkForSimulator] = useState<RedirectLink | null>(null);
  const [isGlobalStatsOpen, setIsGlobalStatsOpen] = useState(false);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Links
  const fetchLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/links');
      if (!res.ok) throw new Error('Failed to load links');
      const data = await res.json();
      if (data.success && Array.isArray(data.links)) {
        setLinks(data.links);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not connect to router backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  // Quick In-Place Target URL Update (Direct answer to user prompt)
  const handleQuickUpdateUrl = async (id: string, newUrl: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/links/${id}/quick-url`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationUrl: newUrl }),
      });
      const data = await res.json();
      if (data.success && data.link) {
        setLinks((prev) => prev.map((l) => (l.id === id ? data.link : l)));
        showToast(lang === 'hi' ? '🎯 गंतव्य तुरंत बदल दिया गया!' : '🎯 Destination target switched instantly!');
        return true;
      } else {
        alert(data.error || 'Failed to update target URL');
        return false;
      }
    } catch (err) {
      console.error('Quick update error:', err);
      return false;
    }
  };

  // Toggle active/paused
  const handleToggleStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/links/${id}/toggle`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (data.success && data.link) {
        setLinks((prev) => prev.map((l) => (l.id === id ? data.link : l)));
        showToast(
          data.link.status === 'active'
            ? (lang === 'hi' ? 'लिंक चालू कर दिया गया' : 'Link Activated')
            : (lang === 'hi' ? 'लिंक रोक दिया गया' : 'Link Paused')
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Link
  const handleDeleteLink = async (id: string) => {
    const confirmMsg = lang === 'hi'
      ? 'क्या आप वाकई इस डायनामिक लिंक को हटाना चाहते हैं?'
      : 'Are you sure you want to delete this dynamic link?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setLinks((prev) => prev.filter((l) => l.id !== id));
        showToast(lang === 'hi' ? 'लिंक हटा दिया गया' : 'Link deleted successfully');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Link (Create or Edit)
  const handleSaveLink = async (payload: Partial<RedirectLink>): Promise<boolean> => {
    try {
      if (linkToEdit) {
        // Update
        const res = await fetch(`/api/links/${linkToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.link) {
          setLinks((prev) => prev.map((l) => (l.id === linkToEdit.id ? data.link : l)));
          showToast(lang === 'hi' ? 'लिंक सफलतापूर्वक अपडेट हुआ!' : 'Link updated successfully!');
          return true;
        } else {
          alert(data.error || 'Failed to update link');
          return false;
        }
      } else {
        // Create
        const res = await fetch('/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.link) {
          setLinks((prev) => [data.link, ...prev]);
          showToast(lang === 'hi' ? 'नया डायनामिक लिंक बन गया!' : 'Dynamic link created successfully!');
          return true;
        } else {
          alert(data.error || 'Failed to create link');
          return false;
        }
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Reset to Demo
  const handleResetDemo = async () => {
    if (!window.confirm(lang === 'hi' ? 'क्या आप सैंपल लिंक्स रीसेट करना चाहते हैं?' : 'Reset to sample links?')) return;
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.links) {
        setLinks(data.links);
        showToast(lang === 'hi' ? 'डेमो लिंक्स रीस्टोर हो गए!' : 'Demo links restored!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export full JSON backup
  const handleExportBackup = () => {
    window.location.href = '/api/export';
  };

  // Compute stats and filtered links
  const aggregateStats = calculateAggregateStats(links);
  const filteredLinks = filterLinks(links, searchQuery, statusFilter, modeFilter);

  // Toggle selection for single item
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all filtered links
  const areAllFilteredSelected = filteredLinks.length > 0 && filteredLinks.every((l) => selectedIds.has(l.id));

  const handleToggleSelectAll = () => {
    if (areAllFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredLinks.forEach((l) => next.delete(l.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredLinks.forEach((l) => next.add(l.id));
        return next;
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Batch activate, pause, or delete
  const handleBatchAction = async (action: 'activate' | 'pause' | 'delete') => {
    const count = selectedIds.size;
    if (count === 0) return;

    if (action === 'delete') {
      const confirmMsg = lang === 'hi'
        ? `क्या आप वाकई चयनित ${count} लिंक्स को हटाना चाहते हैं?`
        : `Are you sure you want to delete all ${count} selected dynamic links?`;
      if (!window.confirm(confirmMsg)) return;
    }

    try {
      setIsBatchProcessing(true);
      const targetIds = Array.from(selectedIds);
      const res = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: targetIds }),
      });
      const data = await res.json();
      if (data.success && data.links) {
        setLinks(data.links);
        setSelectedIds(new Set());
        const msg = action === 'activate'
          ? (lang === 'hi' ? `${count} लिंक्स सक्रिय कर दिए गए` : `${count} links activated`)
          : action === 'pause'
          ? (lang === 'hi' ? `${count} लिंक्स रोक दिए गए` : `${count} links paused`)
          : (lang === 'hi' ? `${count} लिंक्स हटा दिए गए` : `${count} links deleted`);
        showToast(msg);
      } else {
        alert(data.error || 'Batch action failed');
      }
    } catch (err) {
      console.error('Batch action error:', err);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-indigo-600 text-white text-xs sm:text-sm font-medium shadow-2xl shadow-indigo-600/40 flex items-center gap-2 border border-indigo-400/30 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onNewLink={() => {
          setLinkToEdit(null);
          setIsCreateModalOpen(true);
        }}
        onOpenGlobalStats={() => setIsGlobalStatsOpen(true)}
        onResetDemo={handleResetDemo}
        lang={lang}
        onToggleLang={toggleLanguage}
        isLoading={loading}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Banner Explainer (Focusing on the user's specific request) */}
        <div className="mb-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/25 relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'स्मार्ट डायनामिक रीडायरेक्टर' : 'Smart Dynamic Redirect & QR Hub'}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {lang === 'hi'
                  ? 'स्थायी URL एक बार सेट करें — गंतव्य जब चाहे तुरंत बदलें!'
                  : 'Permanent Dynamic URLs — Change Destination Anytime!'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {lang === 'hi'
                  ? 'आप अपना शॉर्ट लिंक या QR कोड किसी पोस्टर, सोशल मीडिया या विजिटिंग कार्ड पर लगा दें। उस लिंक पर क्या वेबसाइट खुलेगी, वह आप इस डैशबोर्ड से किसी भी समय 1-क्लिक में बदल सकते हैं।'
                  : 'Distribute your URL or QR code anywhere. Change what opens at that URL anytime from this dashboard without breaking or reprinting links.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsGlobalStatsOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs sm:text-sm font-medium text-slate-200 transition flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>{lang === 'hi' ? 'ग्लोबल एनालिटिक्स' : 'System Overview'}</span>
              </button>

              <button
                onClick={() => {
                  setLinkToEdit(null);
                  setIsCreateModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs sm:text-sm font-medium text-white transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'hi' ? 'नया लिंक बनाएं' : 'Create Dynamic Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Statistics Overview */}
        <StatsOverview stats={aggregateStats} lang={lang} />

        {/* Search, Filter & View Controls */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'hi' ? 'टाइटल, स्लग (/r/...) या गंतव्य खोजें...' : 'Search title, slug, or target URL...'}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-500 hover:text-slate-300 absolute right-3 top-1/2 -translate-y-1/2"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {/* Status Filter */}
              <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition font-medium ${
                    statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang === 'hi' ? 'सभी' : 'All'} ({links.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg transition font-medium ${
                    statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang === 'hi' ? 'सक्रिय' : 'Active'} ({aggregateStats.activeLinks})
                </button>
                <button
                  onClick={() => setStatusFilter('paused')}
                  className={`px-3 py-1.5 rounded-lg transition font-medium ${
                    statusFilter === 'paused' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang === 'hi' ? 'रोके गए' : 'Paused'} ({aggregateStats.pausedLinks})
                </button>
              </div>

              {/* Mode Filter Dropdown */}
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 shrink-0"
              >
                <option value="all">{lang === 'hi' ? 'सभी प्रकार (Modes)' : 'All Modes'}</option>
                <option value="direct">⚡ Direct (302)</option>
                <option value="cloak">🛡️ Cloaked Frame</option>
                <option value="splash">⏳ Splash Screen</option>
                <option value="device">📱 Device Routing</option>
                <option value="bio">📄 Bio Page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Multi-Selection Controls Bar */}
        {filteredLinks.length > 0 && (
          <div className="mb-3 px-1 py-1.5 flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 hover:text-slate-200 transition font-medium group"
              aria-label={areAllFilteredSelected ? (lang === 'hi' ? 'सभी अनसेलेक्ट करें' : 'Deselect all links') : (lang === 'hi' ? 'सभी चुनें' : 'Select all links')}
            >
              <span className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                areAllFilteredSelected
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                  : selectedIds.size > 0
                  ? 'bg-indigo-950 border-indigo-500 text-indigo-400'
                  : 'border-slate-700 bg-slate-900 group-hover:border-slate-500'
              }`}>
                {areAllFilteredSelected ? (
                  <Check className="w-3 h-3 text-white" />
                ) : selectedIds.size > 0 ? (
                  <span className="w-2 h-0.5 bg-indigo-400 rounded-full" />
                ) : null}
              </span>
              <span>
                {areAllFilteredSelected 
                  ? (lang === 'hi' ? 'सभी अनसेलेक्ट करें' : 'Deselect All') 
                  : (lang === 'hi' ? `सभी चुनें (${filteredLinks.length})` : `Select All (${filteredLinks.length})`)}
              </span>
            </button>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 font-semibold">
                  {selectedIds.size} {lang === 'hi' ? 'चयनित' : 'selected'}
                </span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                >
                  {lang === 'hi' ? 'हटाएं' : 'Clear'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Links List Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
            <p className="text-xs">{lang === 'hi' ? 'लिंक्स लोड हो रहे हैं...' : 'Loading dynamic routers...'}</p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="p-12 sm:p-16 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto text-2xl">
              🔍
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {lang === 'hi' ? 'कोई डायनामिक लिंक नहीं मिला' : 'No dynamic links found'}
              </h3>
              <p className="text-xs text-slate-400">
                {searchQuery || statusFilter !== 'all' || modeFilter !== 'all'
                  ? (lang === 'hi' ? 'फिल्टर या सर्च क्वेरी बदल कर देखें।' : 'Try adjusting your search query or filters.')
                  : (lang === 'hi' ? 'नया डायनामिक लिंक बनाएं और तुरंत किसी भी URL पर रीडायरेक्ट करवाएं।' : 'Create your first dynamic link to begin switching destinations.')}
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setModeFilter('all');
                setLinkToEdit(null);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium transition inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'hi' ? 'नया लिंक बनाएं' : 'Create New Link'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                isSelected={selectedIds.has(link.id)}
                onToggleSelect={handleToggleSelect}
                onQuickUpdateUrl={handleQuickUpdateUrl}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteLink}
                onOpenQr={(l) => setLinkForQr(l)}
                onOpenAnalytics={(l) => setLinkForAnalytics(l)}
                onOpenEdit={(l) => {
                  setLinkToEdit(l);
                  setIsCreateModalOpen(true);
                }}
                onOpenSimulator={(l) => setLinkForSimulator(l)}
                lang={lang}
              />
            ))}
          </div>
        )}

        {/* Floating Batch Actions Dock */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-indigo-500/50 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-2xl shadow-indigo-950/80 flex items-center gap-2 sm:gap-3 animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 rounded-lg text-indigo-300 font-semibold text-xs border border-indigo-500/20 shrink-0">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{selectedIds.size} {lang === 'hi' ? 'चयनित' : 'selected'}</span>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            {/* Batch Activate */}
            <button
              onClick={() => handleBatchAction('activate')}
              disabled={isBatchProcessing}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-medium transition flex items-center gap-1.5"
              title="Activate all selected links"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'चालू करें' : 'Activate All'}</span>
            </button>

            {/* Batch Pause */}
            <button
              onClick={() => handleBatchAction('pause')}
              disabled={isBatchProcessing}
              className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-medium transition flex items-center gap-1.5"
              title="Pause all selected links"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'रोकें' : 'Pause All'}</span>
            </button>

            {/* Batch Delete */}
            <button
              onClick={() => handleBatchAction('delete')}
              disabled={isBatchProcessing}
              className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-red-200 text-xs font-medium transition flex items-center gap-1.5"
              title="Delete all selected links"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'हटाएं' : 'Delete All'}</span>
            </button>

            <div className="h-4 w-px bg-slate-700" />

            {/* Clear Selection */}
            <button
              onClick={handleClearSelection}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title={lang === 'hi' ? 'चयन रद्द करें' : 'Cancel selection'}
              aria-label="Cancel selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">SwitchLink</span>
            <span>•</span>
            <span>Dynamic URL Router & QR Hub</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsGlobalStatsOpen(true)}
              className="hover:text-slate-300 transition"
            >
              {lang === 'hi' ? 'सिस्टम स्टेटस' : 'System Status'}
            </button>
            <span>•</span>
            <button
              onClick={handleExportBackup}
              className="hover:text-slate-300 transition"
            >
              Download Backup (JSON)
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateEditLinkModal
        isOpen={isCreateModalOpen}
        linkToEdit={linkToEdit}
        onClose={() => {
          setIsCreateModalOpen(false);
          setLinkToEdit(null);
        }}
        onSave={handleSaveLink}
        lang={lang}
      />

      {linkForQr && (
        <QrCodeModal
          link={linkForQr}
          onClose={() => setLinkForQr(null)}
          lang={lang}
        />
      )}

      {linkForAnalytics && (
        <AnalyticsModal
          link={linkForAnalytics}
          onClose={() => setLinkForAnalytics(null)}
          lang={lang}
        />
      )}

      {linkForSimulator && (
        <PreviewSimulatorModal
          link={linkForSimulator}
          onClose={() => setLinkForSimulator(null)}
          lang={lang}
        />
      )}

      <GlobalStatsModal
        isOpen={isGlobalStatsOpen}
        onClose={() => setIsGlobalStatsOpen(false)}
        stats={aggregateStats}
        onExport={handleExportBackup}
        lang={lang}
      />
    </div>
  );
}
