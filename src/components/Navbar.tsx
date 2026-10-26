import React from 'react';
import { ArrowRightLeft, Plus, RefreshCw, BarChart3 } from 'lucide-react';

interface NavbarProps {
  onNewLink: () => void;
  onOpenGlobalStats: () => void;
  onResetDemo: () => void;
  lang: 'en' | 'hi';
  onToggleLang: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewLink,
  onOpenGlobalStats,
  onResetDemo,
  lang,
  onToggleLang,
  isLoading,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                Switch<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Link</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full uppercase tracking-wider">
                Dynamic Router
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {lang === 'hi' 
                ? 'स्थायी URL सेट करें, गंतव्य कभी भी बदलें'
                : 'Permanent URLs • Change destinations anytime'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs font-medium text-slate-300 transition flex items-center gap-1.5"
            title="Toggle Hindi/English interface hints"
          >
            <span>🌐</span>
            <span>{lang === 'hi' ? 'हिंदी' : 'English'}</span>
          </button>

          {/* Global Analytics */}
          <button
            onClick={onOpenGlobalStats}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-xs font-medium text-slate-200 transition flex items-center gap-1.5"
            title="View overall system stats"
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">
              {lang === 'hi' ? 'एनालिटिक्स' : 'Analytics'}
            </span>
          </button>

          {/* Reset Demo Links */}
          <button
            onClick={onResetDemo}
            disabled={isLoading}
            className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Restore sample dynamic links"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* New Link CTA */}
          <button
            onClick={onNewLink}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-xs sm:text-sm transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'hi' ? 'नया लिंक बनाएं' : 'New Dynamic Link'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
