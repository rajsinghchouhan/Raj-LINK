import React from 'react';
import { Link2, MousePointerClick, ShieldCheck, Flame } from 'lucide-react';
import { AggregateStats } from '../types/link';

interface StatsOverviewProps {
  stats: AggregateStats;
  lang: 'en' | 'hi';
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, lang }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {/* Total Links */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {lang === 'hi' ? 'कुल लिंक्स' : 'Total Dynamic Links'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Link2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {stats.totalLinks}
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{stats.activeLinks} {lang === 'hi' ? 'सक्रिय' : 'Active'}</span>
          <span>•</span>
          <span>{stats.pausedLinks} {lang === 'hi' ? 'रोके गए' : 'Paused'}</span>
        </div>
      </div>

      {/* Total Clicks */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {lang === 'hi' ? 'कुल क्लिक / स्कैन्स' : 'Total Clicks & Scans'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <MousePointerClick className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {stats.totalClicks.toLocaleString()}
        </div>
        <div className="text-xs text-emerald-400/90 mt-1 flex items-center gap-1">
          <span>⚡</span>
          <span>{lang === 'hi' ? 'रीयल-टाइम रीडायरेक्शन' : 'Real-time routing'}</span>
        </div>
      </div>

      {/* Mobile vs Desktop Clicks */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {lang === 'hi' ? 'डिवाइस वितरण' : 'Device Distribution'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-bold text-white flex items-baseline gap-2">
          <span>📱 {stats.deviceCounts.mobile}</span>
          <span className="text-slate-600 text-sm">/</span>
          <span>💻 {stats.deviceCounts.desktop}</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {lang === 'hi' ? 'स्मार्ट डिवाइस टारगेटिंग सक्रिय' : 'Mobile / Desktop clicks'}
        </div>
      </div>

      {/* Top Performing Link */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {lang === 'hi' ? 'सबसे लोकप्रिय लिंक' : 'Top Performing'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        {stats.mostActiveLink ? (
          <div>
            <div className="font-bold text-white truncate text-base" title={stats.mostActiveLink.title}>
              /{stats.mostActiveLink.slug}
            </div>
            <div className="text-xs text-amber-400 mt-1">
              🔥 {stats.mostActiveLink.clicks} {lang === 'hi' ? 'क्लिक्स' : 'hits'}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 mt-2">
            {lang === 'hi' ? 'कोई क्लिक नहीं मिला' : 'No clicks logged yet'}
          </div>
        )}
      </div>
    </div>
  );
};
