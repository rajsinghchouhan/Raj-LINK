import React, { useEffect, useState } from 'react';
import { X, BarChart3, Smartphone, Monitor, Globe, Clock, Download, ArrowUpRight } from 'lucide-react';
import { RedirectLink, ClickEvent } from '../types/link';

interface AnalyticsModalProps {
  link: RedirectLink | null;
  onClose: () => void;
  lang: 'en' | 'hi';
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ link, onClose, lang }) => {
  const [clickLogs, setClickLogs] = useState<ClickEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!link) return;
    setLoading(true);
    fetch(`/api/links/${link.id}/analytics`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.clicks) {
          setClickLogs(data.clicks);
        }
      })
      .catch((err) => console.error('Error fetching analytics:', err))
      .finally(() => setLoading(false));
  }, [link]);

  if (!link) return null;

  // Calculate statistics
  const total = clickLogs.length || link.clicks || 0;
  const mobileCount = clickLogs.filter((c) => c.device === 'ios' || c.device === 'android').length;
  const desktopCount = clickLogs.filter((c) => c.device === 'desktop').length;
  const tabletCount = clickLogs.filter((c) => c.device === 'tablet').length;
  const otherCount = total - (mobileCount + desktopCount + tabletCount);

  // Group by browser
  const browserCounts: Record<string, number> = {};
  for (const c of clickLogs) {
    const b = c.browser || 'Other';
    browserCounts[b] = (browserCounts[b] || 0) + 1;
  }

  const handleExportCsv = () => {
    if (clickLogs.length === 0) return;
    const headers = ['Timestamp', 'Slug', 'Device', 'Browser', 'OS', 'Referrer', 'Target'];
    const rows = clickLogs.map((c) => [
      c.timestamp,
      c.slug,
      c.device,
      c.browser,
      c.os,
      `"${(c.referrer || '').replace(/"/g, '""')}"`,
      `"${(c.targetDestination || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const linkEl = document.createElement('a');
    linkEl.setAttribute('href', encodedUri);
    linkEl.setAttribute('download', `analytics-${link.slug}.csv`);
    document.body.appendChild(linkEl);
    linkEl.click();
    document.body.removeChild(linkEl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative overflow-hidden max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white">
                {lang === 'hi' ? 'रीडायरेक्शन एनालिटिक्स व क्लिक लॉग्स' : 'Redirection Analytics & Visit Logs'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {link.title} • <span className="font-mono text-indigo-400">/r/{link.slug}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                {lang === 'hi' ? 'कुल क्लिक्स' : 'Total Hits'}
              </div>
              <div className="text-2xl font-bold text-white">{total}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                {lang === 'hi' ? 'मोबाइल' : 'Mobile'}
              </div>
              <div className="text-2xl font-bold text-emerald-400 flex items-center gap-1">
                <Smartphone className="w-5 h-5" />
                <span>{mobileCount}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                {lang === 'hi' ? 'डेस्कटॉप' : 'Desktop'}
              </div>
              <div className="text-2xl font-bold text-cyan-400 flex items-center gap-1">
                <Monitor className="w-5 h-5" />
                <span>{desktopCount}</span>
              </div>
            </div>
          </div>

          {/* Device Distribution Progress */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">{lang === 'hi' ? 'डिवाइस ब्रेकडाउन' : 'Device Distribution'}</span>
              <span className="text-slate-400">
                {total > 0 ? `${Math.round((mobileCount / total) * 100)}% mobile` : 'No data'}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${total > 0 ? (mobileCount / total) * 100 : 50}%` }}
                title="Mobile"
              />
              <div
                className="bg-cyan-500 h-full transition-all"
                style={{ width: `${total > 0 ? (desktopCount / total) * 100 : 50}%` }}
                title="Desktop"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Mobile (iOS / Android)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span>Desktop (PC / Mac)</span>
              </div>
            </div>
          </div>

          {/* Live Recent Visit Stream */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {lang === 'hi' ? 'हाल के विज़िट्स (Recent Visits)' : 'Recent Visit Stream'}
              </span>
              {clickLogs.length > 0 && (
                <button
                  onClick={handleExportCsv}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Loading analytics data...
              </div>
            ) : clickLogs.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                {lang === 'hi'
                  ? 'अभी तक इस लिंक पर कोई क्लिक या स्कैन नहीं आया है। आप ऊपर "Test" पर क्लिक करके इसे टेस्ट कर सकते हैं!'
                  : 'No clicks recorded yet. Test the link or scan its QR code to see live analytics!'}
              </div>
            ) : (
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="p-2.5 font-medium">Time</th>
                        <th className="p-2.5 font-medium">Device</th>
                        <th className="p-2.5 font-medium">Browser / OS</th>
                        <th className="p-2.5 font-medium">Referrer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                      {clickLogs.slice().reverse().map((clk) => (
                        <tr key={clk.id} className="hover:bg-slate-900/40">
                          <td className="p-2.5 text-slate-400 whitespace-nowrap">
                            {new Date(clk.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="p-2.5 capitalize text-slate-200">
                            {clk.device}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            {clk.browser} • {clk.os}
                          </td>
                          <td className="p-2.5 truncate max-w-[120px] text-slate-400" title={clk.referrer}>
                            {clk.referrer}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Current destination: <span className="text-slate-400 truncate font-mono">{link.destinationUrl}</span>
          </span>
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
