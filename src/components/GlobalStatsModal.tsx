import React from 'react';
import { X, BarChart3, Download, Upload, Shield, Zap, Globe, Sparkles } from 'lucide-react';
import { AggregateStats } from '../types/link';

interface GlobalStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: AggregateStats;
  onExport: () => void;
  lang: 'en' | 'hi';
}

export const GlobalStatsModal: React.FC<GlobalStatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onExport,
  lang,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {lang === 'hi' ? 'ग्लोबल सिस्टम एनालिटिक्स' : 'System Overview & Data Hub'}
              </h2>
              <p className="text-xs text-slate-400">
                SwitchLink Smart Router • Real-time Stats
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                {lang === 'hi' ? 'सक्रिय राउटर्स' : 'Active Routers'}
              </div>
              <div className="text-2xl font-bold text-emerald-400">{stats.activeLinks} / {stats.totalLinks}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {stats.pausedLinks} {lang === 'hi' ? 'रोके गए लिंक्स' : 'paused links'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                {lang === 'hi' ? 'कुल क्लिक्स व स्कैन्स' : 'Total Hits Recorded'}
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalClicks.toLocaleString()}</div>
              <div className="text-[11px] text-indigo-400 mt-1">
                ⚡ 0ms latency redirect
              </div>
            </div>
          </div>

          {/* Backup & Data Export Section */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {lang === 'hi' ? 'डेटा बैकअप व एक्सपोर्ट' : 'Backup & Data Export'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'hi'
                    ? 'अपने सभी लिंक्स और सेटिंग्स को JSON फाइल में डाउनलोड करें'
                    : 'Download complete configuration file to store on GitHub or restore later'}
                </p>
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={onExport}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'hi' ? 'पूरा डेटा बैकअप डाउनलोड करें (JSON)' : 'Download Full Backup (JSON)'}</span>
              </button>
            </div>
          </div>

          {/* Marketing Tip */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/20 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>{lang === 'hi' ? 'सुपरपावर टिप' : 'Dynamic URL Advantage'}</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              {lang === 'hi'
                ? 'जब आप कोई QR कोड या लिंक सोशल मीडिया, विजिटिंग कार्ड या प्रोडक्ट बॉक्स पर डालते हैं, तो SwitchLink का उपयोग करें। अगर आपकी वेबसाइट का लिंक भविष्य में बदलता भी है, तो आपको कभी दोबारा प्रिंट नहीं करना पड़ेगा!'
                : 'Whenever sharing links on flyers, billboards, packaging, or bios, use SwitchLink. If your campaign, shop, or landing page changes, you never have to replace printed materials!'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
