import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, Printer, Sparkles, RefreshCw } from 'lucide-react';
import { RedirectLink } from '../types/link';

interface QrCodeModalProps {
  link: RedirectLink | null;
  onClose: () => void;
  lang: 'en' | 'hi';
}

const COLOR_PRESETS = [
  { name: 'Dark Slate', dark: '#0f172a', light: '#ffffff' },
  { name: 'Indigo Glow', dark: '#4338ca', light: '#ffffff' },
  { name: 'Emerald Forest', dark: '#047857', light: '#ffffff' },
  { name: 'Midnight Violet', dark: '#581c87', light: '#ffffff' },
  { name: 'Inverted Dark', dark: '#ffffff', light: '#090d16' },
];

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ link, onClose, lang }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [darkColor, setDarkColor] = useState('#0f172a');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [copied, setCopied] = useState(false);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [svgString, setSvgString] = useState<string>('');

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const targetRedirectUrl = link ? `${origin}/r/${link.slug}` : '';

  // Generate QR code on canvas whenever colors or link changes
  useEffect(() => {
    if (!link || !canvasRef.current || !targetRedirectUrl) return;

    QRCode.toCanvas(
      canvasRef.current,
      targetRedirectUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        errorCorrectionLevel: 'H',
      },
      (error) => {
        if (error) {
          console.error('QR code generation error:', error);
          return;
        }
        if (canvasRef.current) {
          setDataUrl(canvasRef.current.toDataURL('image/png'));
        }
      }
    );

    QRCode.toString(
      targetRedirectUrl,
      {
        type: 'svg',
        margin: 2,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        errorCorrectionLevel: 'H',
      },
      (err, svg) => {
        if (!err && svg) {
          setSvgString(svg);
        }
      }
    );
  }, [link, darkColor, lightColor, targetRedirectUrl]);

  const handleDownloadPng = () => {
    // Generate high resolution (1024x1024) PNG for printing
    QRCode.toDataURL(
      targetRedirectUrl,
      {
        width: 1024,
        margin: 2,
        color: { dark: darkColor, light: lightColor },
        errorCorrectionLevel: 'H',
      },
      (err, url) => {
        if (err || !url) return;
        const a = document.createElement('a');
        a.href = url;
        a.download = `dynamic-qr-${link.slug}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    );
  };

  const handleDownloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dynamic-qr-${link.slug}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {
      // Fallback: copy link text
      await navigator.clipboard.writeText(targetRedirectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!link) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white">
                {lang === 'hi' ? 'डायनामिक QR कोड स्टूडियो' : 'Dynamic QR Code Studio'}
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
          {/* Key Benefit Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200/90 leading-relaxed">
            <span className="font-semibold text-indigo-300">💡 {lang === 'hi' ? 'QR कभी एक्सपायर नहीं होता!' : 'Print Once, Change Destination Anytime:'}</span>{' '}
            {lang === 'hi'
              ? 'इस QR कोड को किसी भी पोस्टर, बॉक्स, मेन्यू या विजिटिंग कार्ड पर प्रिंट करें। आप जब चाहें डैशबोर्ड से बदल सकते हैं कि यह QR स्कैन करने पर क्या खुलेगा!'
              : 'Print this QR code on physical brochures, product boxes, or menus. You can change where it goes anytime from this dashboard without changing the QR!'}
          </div>

          {/* QR Canvas Display Card */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-inner">
            <div className="p-4 rounded-2xl bg-white shadow-xl flex items-center justify-center">
              <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg" />
            </div>

            <div className="text-center mt-4 space-y-1">
              <div className="text-xs font-mono text-slate-400 truncate max-w-xs">
                {targetRedirectUrl}
              </div>
              <div className="text-[11px] text-emerald-400 font-medium">
                → {lang === 'hi' ? 'रीडायरेक्ट होगा:' : 'Currently opens:'} {link.destinationUrl}
              </div>
            </div>
          </div>

          {/* Color Customizer */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              {lang === 'hi' ? 'कलर थीम चुनें' : 'Color Presets & Style'}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDarkColor(preset.dark);
                    setLightColor(preset.light);
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition text-[11px] ${
                    darkColor === preset.dark
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center overflow-hidden" style={{ backgroundColor: preset.light }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.dark }} />
                  </div>
                  <span className="truncate w-full text-center text-[10px]">{preset.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            onClick={handleCopyImage}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (lang === 'hi' ? 'कॉपी हुआ' : 'Copied!') : (lang === 'hi' ? 'इमेज कॉपी करें' : 'Copy Image')}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSvg}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5"
              title="Best for high quality print & vinyl stickers"
            >
              <Download className="w-4 h-4" />
              <span>SVG (Print)</span>
            </button>
            <button
              onClick={handleDownloadPng}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
              title="Download 1024x1024 High-Res PNG"
            >
              <Download className="w-4 h-4" />
              <span>PNG (HD)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
