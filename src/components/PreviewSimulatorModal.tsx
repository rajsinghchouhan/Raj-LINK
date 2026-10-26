import React, { useState } from 'react';
import { X, Smartphone, Monitor, ExternalLink, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { RedirectLink } from '../types/link';

interface PreviewSimulatorModalProps {
  link: RedirectLink | null;
  onClose: () => void;
  lang: 'en' | 'hi';
}

export const PreviewSimulatorModal: React.FC<PreviewSimulatorModalProps> = ({ link, onClose, lang }) => {
  const [deviceView, setDeviceView] = useState<'mobile' | 'desktop'>('mobile');
  const [simulatedDevice, setSimulatedDevice] = useState<'ios' | 'android' | 'desktop'>('ios');
  const [key, setKey] = useState(0);

  if (!link) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectUrl = `${origin}/r/${link.slug}`;

  // Compute what destination opens based on simulated device
  let effectiveTarget = link.destinationUrl;
  if (link.mode === 'device' && link.deviceRules) {
    if (simulatedDevice === 'ios' && link.deviceRules.iosUrl) {
      effectiveTarget = link.deviceRules.iosUrl;
    } else if (simulatedDevice === 'android' && link.deviceRules.androidUrl) {
      effectiveTarget = link.deviceRules.androidUrl;
    } else if (link.deviceRules.desktopUrl) {
      effectiveTarget = link.deviceRules.desktopUrl;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>👁️</span>
              <span>{lang === 'hi' ? 'रीडायरेक्ट सिम्युलेटर व टेस्ट' : 'Redirect Simulator & Live Test'}</span>
            </h2>
            <p className="text-xs text-slate-400">
              Testing <span className="text-indigo-400 font-mono">/r/{link.slug}</span> → {effectiveTarget}
            </p>
          </div>

          {/* Controls: Viewport toggle & Simulated Device */}
          <div className="flex items-center gap-2">
            {link.mode === 'device' && (
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setSimulatedDevice('ios')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    simulatedDevice === 'ios' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  iOS (iPhone)
                </button>
                <button
                  onClick={() => setSimulatedDevice('android')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    simulatedDevice === 'android' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  Android
                </button>
                <button
                  onClick={() => setSimulatedDevice('desktop')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    simulatedDevice === 'desktop' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  Desktop
                </button>
              </div>
            )}

            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setDeviceView('mobile')}
                className={`p-1.5 rounded-lg transition ${
                  deviceView === 'mobile' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400'
                }`}
                title="Mobile frame"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceView('desktop')}
                className={`p-1.5 rounded-lg transition ${
                  deviceView === 'desktop' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400'
                }`}
                title="Desktop frame"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setKey((k) => k + 1)}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
              title="Reload preview"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Simulator Frame Container */}
        <div className="flex-1 overflow-y-auto py-4 flex items-center justify-center bg-slate-950/80 rounded-2xl border border-slate-800/80 my-3 p-4">
          {deviceView === 'mobile' ? (
            /* Smartphone Shell */
            <div className="w-[320px] h-[560px] bg-slate-900 border-[6px] border-slate-800 rounded-[38px] shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-slate-700">
              {/* Phone Speaker & Camera Notch */}
              <div className="w-full h-6 bg-slate-900 flex items-center justify-center shrink-0">
                <div className="w-16 h-3 bg-slate-800 rounded-full" />
              </div>

              {/* Browser Address Bar */}
              <div className="px-3 py-1.5 bg-slate-800/90 border-b border-slate-700/60 flex items-center gap-1.5 text-[11px] text-slate-300 font-mono shrink-0">
                <span className="text-emerald-400 text-[10px]">🔒</span>
                <span className="truncate">/r/{link.slug}</span>
              </div>

              {/* Frame Content */}
              <div className="flex-1 w-full bg-slate-950 overflow-hidden relative">
                <iframe
                  key={key}
                  src={redirectUrl}
                  title="Mobile Redirect Preview"
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-forms allow-same-origin"
                />
              </div>

              {/* Bottom Home Indicator */}
              <div className="w-full h-4 bg-slate-900 flex items-center justify-center shrink-0">
                <div className="w-24 h-1 bg-slate-700 rounded-full" />
              </div>
            </div>
          ) : (
            /* Desktop Browser Shell */
            <div className="w-full h-[520px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              {/* Browser Header Bar */}
              <div className="px-4 py-2.5 bg-slate-800/90 border-b border-slate-700 flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex-1 max-w-md mx-auto px-3 py-1 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-2 border border-slate-700/60">
                  <span className="text-emerald-400 text-xs">🔒</span>
                  <span className="truncate">{redirectUrl}</span>
                </div>
              </div>

              {/* Frame Content */}
              <div className="flex-1 w-full bg-slate-950 overflow-hidden relative">
                <iframe
                  key={key}
                  src={redirectUrl}
                  title="Desktop Redirect Preview"
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-forms allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              {lang === 'hi' 
                ? 'लाइव रीडायरेक्शन सक्रिय है' 
                : 'Live router active: Click Open in New Tab to test external site'}
            </span>
          </div>
          <a
            href={redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1 transition"
          >
            <span>{lang === 'hi' ? 'नए टैब में खोलें' : 'Open in New Tab'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
