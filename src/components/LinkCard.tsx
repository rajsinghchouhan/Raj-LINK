import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  BarChart2, 
  Edit3, 
  Trash2, 
  Pause, 
  Play, 
  Eye, 
  Sparkles,
  Smartphone,
  Layers,
  Clock,
  Shield,
  Save,
  X
} from 'lucide-react';
import { RedirectLink, RedirectMode } from '../types/link';

interface LinkCardProps {
  link: RedirectLink;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onQuickUpdateUrl: (id: string, newUrl: string) => Promise<boolean>;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenQr: (link: RedirectLink) => void;
  onOpenAnalytics: (link: RedirectLink) => void;
  onOpenEdit: (link: RedirectLink) => void;
  onOpenSimulator: (link: RedirectLink) => void;
  lang: 'en' | 'hi';
}

export const LinkCard: React.FC<LinkCardProps> = ({
  link,
  isSelected = false,
  onToggleSelect,
  onQuickUpdateUrl,
  onToggleStatus,
  onDelete,
  onOpenQr,
  onOpenAnalytics,
  onOpenEdit,
  onOpenSimulator,
  lang,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [targetInput, setTargetInput] = useState(link.destinationUrl);
  const [isUpdating, setIsUpdating] = useState(false);
  const [quickUpdateSuccess, setQuickUpdateSuccess] = useState(false);

  // Derive full dynamic URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const fullDynamicUrl = `${origin}/r/${link.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullDynamicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveQuickUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetInput.trim() || targetInput === link.destinationUrl) {
      setIsEditingUrl(false);
      return;
    }
    setIsUpdating(true);
    const success = await onQuickUpdateUrl(link.id, targetInput.trim());
    setIsUpdating(false);
    if (success) {
      setIsEditingUrl(false);
      setQuickUpdateSuccess(true);
      setTimeout(() => setQuickUpdateSuccess(false), 3000);
    }
  };

  const getModeBadge = (mode: RedirectMode) => {
    switch (mode) {
      case 'direct':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span>⚡</span>
            <span>{lang === 'hi' ? 'डायरेक्ट 302' : 'Direct Redirect'}</span>
          </span>
        );
      case 'cloak':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Layers className="w-3 h-3" />
            <span>{lang === 'hi' ? 'मास्क्ड / क्लोक्ड' : 'Cloaked Frame'}</span>
          </span>
        );
      case 'splash':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            <span>{lang === 'hi' ? 'स्प्लैश स्क्रीन' : 'Splash Countdown'}</span>
          </span>
        );
      case 'device':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Smartphone className="w-3 h-3" />
            <span>{lang === 'hi' ? 'स्मार्ट डिवाइस' : 'Device Routing'}</span>
          </span>
        );
      case 'bio':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Sparkles className="w-3 h-3" />
            <span>{lang === 'hi' ? 'बायो पेज' : 'Bio Page'}</span>
          </span>
        );
    }
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
      isSelected
        ? 'bg-indigo-950/40 border-indigo-500 shadow-xl ring-1 ring-indigo-500/50'
        : link.status === 'active' 
        ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-xl' 
        : 'bg-slate-950/60 border-slate-800/60 opacity-80'
    }`}>
      {/* Top Bar: Checkbox, Title, Status toggle, Mode Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Multi-selection Checkbox */}
          {onToggleSelect && (
            <button
              type="button"
              onClick={() => onToggleSelect(link.id)}
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-950/80 border-slate-700 hover:border-slate-500 text-transparent'
              }`}
              title={isSelected ? (lang === 'hi' ? 'अनसेलेक्ट करें' : 'Deselect') : (lang === 'hi' ? 'सेलेक्ट करें' : 'Select')}
              aria-label={`Select ${link.title}`}
            >
              <Check className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'scale-100 text-white' : 'scale-0'}`} />
            </button>
          )}

          <button
            onClick={() => onToggleStatus(link.id)}
            className={`w-3 h-3 rounded-full transition-all shrink-0 ${
              link.status === 'active' 
                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/80 animate-pulse' 
                : 'bg-slate-600'
            }`}
            title={link.status === 'active' ? (lang === 'hi' ? 'सक्रिय (रोकने के लिए क्लिक करें)' : 'Active (Click to pause)') : (lang === 'hi' ? 'रुका हुआ (चालू करने के लिए क्लिक करें)' : 'Paused (Click to activate)')}
            aria-label={`Toggle status for ${link.title}`}
          />
          <h3 className="font-semibold text-slate-100 text-base sm:text-lg truncate" title={link.title}>
            {link.title}
          </h3>
          {link.password && (
            <span className="text-slate-400" title={lang === 'hi' ? 'पासकोड से सुरक्षित' : 'Password protected'}>
              <Shield className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {getModeBadge(link.mode)}
          <button
            onClick={() => onToggleStatus(link.id)}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 border ${
              link.status === 'active'
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
                : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/50'
            }`}
          >
            {link.status === 'active' ? (
              <>
                <Pause className="w-3 h-3" />
                <span className="hidden sm:inline">{lang === 'hi' ? 'रोकें' : 'Pause'}</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                <span>{lang === 'hi' ? 'चालू करें' : 'Resume'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dynamic Link Box (Permanent URL to share or put in QR codes) */}
      <div className="mb-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xs font-mono font-semibold shrink-0">
            Dynamic URL
          </span>
          <a
            href={fullDynamicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-300 hover:text-indigo-200 text-xs sm:text-sm font-mono truncate underline decoration-indigo-500/30 hover:decoration-indigo-400"
            title="Open dynamic redirect in new tab"
          >
            {fullDynamicUrl}
          </a>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs"
            title="Copy permanent link"
            aria-label="Copy dynamic URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? (lang === 'hi' ? 'कॉपी हुआ' : 'Copied') : (lang === 'hi' ? 'कॉपी' : 'Copy')}</span>
          </button>

          <a
            href={fullDynamicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Open destination in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Destination Section with Instant In-Place URL Switcher */}
      <div className="mb-4 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span>🎯</span>
              <span>{lang === 'hi' ? 'वर्तमान गंतव्य (Current Destination)' : 'Opens This Target'}</span>
            </span>
            {quickUpdateSuccess && (
              <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium animate-bounce">
                {lang === 'hi' ? 'गंतव्य बदल गया!' : 'Target Updated!'}
              </span>
            )}
          </div>
          {!isEditingUrl && (
            <button
              onClick={() => {
                setTargetInput(link.destinationUrl);
                setIsEditingUrl(true);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 hover:underline transition"
            >
              <Edit3 className="w-3 h-3" />
              <span>{lang === 'hi' ? 'URL तुरंत बदलें' : 'Change Target'}</span>
            </button>
          )}
        </div>

        {isEditingUrl ? (
          <form onSubmit={handleSaveQuickUrl} className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder="https://example.com/new-destination"
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-indigo-500/50 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                autoFocus
              />
              <button
                type="submit"
                disabled={isUpdating}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 transition shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'सेव करें' : 'Save'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingUrl(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              {lang === 'hi' 
                ? '💡 आप इस URL को कभी भी बदल सकते हैं, आपका मुख्य लिंक/QR Code वही रहेगा।'
                : '💡 Update where this link points anytime. Your physical QR codes or shared links stay the same.'}
            </p>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm text-slate-300 font-mono truncate" title={link.destinationUrl}>
              {link.destinationUrl}
            </span>
            {link.mode === 'device' && (
              <span className="text-[10px] text-cyan-400 shrink-0 font-medium">
                (Device Rules Active)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Bar: Stats, Tags & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        {/* Left: Clicks counter & Tags */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="font-semibold text-white">{link.clicks}</span>
            <span className="text-slate-400">{lang === 'hi' ? 'क्लिक्स / स्कैन्स' : 'clicks / scans'}</span>
          </div>

          {link.tags && link.tags.length > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              {link.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Simulator / Test button */}
          <button
            onClick={() => onOpenSimulator(link)}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition flex items-center gap-1 text-xs"
            title="Preview / Simulate Redirect"
            aria-label={`Simulate ${link.title}`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{lang === 'hi' ? 'टेस्ट करें' : 'Test'}</span>
          </button>

          {/* Dynamic QR Studio */}
          <button
            onClick={() => onOpenQr(link)}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition flex items-center gap-1 text-xs"
            title="Generate & Customize Dynamic QR Code"
            aria-label={`QR Code for ${link.title}`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden md:inline">QR Code</span>
          </button>

          {/* Analytics */}
          <button
            onClick={() => onOpenAnalytics(link)}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-indigo-400 transition flex items-center gap-1 text-xs"
            title="View Click Analytics"
            aria-label={`Analytics for ${link.title}`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{lang === 'hi' ? 'एनालिटिक्स' : 'Stats'}</span>
          </button>

          {/* Full Edit Settings */}
          <button
            onClick={() => onOpenEdit(link)}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition"
            title="Full Settings"
            aria-label={`Edit ${link.title}`}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(link.id)}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
            title="Delete dynamic link"
            aria-label={`Delete ${link.title}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
