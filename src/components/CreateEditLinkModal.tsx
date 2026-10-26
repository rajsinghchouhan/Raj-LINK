import React, { useState, useEffect } from 'react';
import { X, Sparkles, Smartphone, Layers, Clock, Shield, Globe, ArrowRight, Save, Plus, Trash2 } from 'lucide-react';
import { RedirectLink, RedirectMode, DeviceRules, SplashSettings, BioSettings, CloakSettings } from '../types/link';
import { normalizeSlug, validateUrl } from '../utils/redirectLogic';

interface CreateEditLinkModalProps {
  isOpen: boolean;
  linkToEdit: RedirectLink | null;
  onClose: () => void;
  onSave: (linkData: Partial<RedirectLink>) => Promise<boolean>;
  lang: 'en' | 'hi';
}

export const CreateEditLinkModal: React.FC<CreateEditLinkModalProps> = ({
  isOpen,
  linkToEdit,
  onClose,
  onSave,
  lang,
}) => {
  const isEditing = Boolean(linkToEdit);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [mode, setMode] = useState<RedirectMode>('direct');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'active' | 'paused'>('active');

  // Mode Specific States
  const [deviceRules, setDeviceRules] = useState<DeviceRules>({
    iosUrl: '',
    androidUrl: '',
    desktopUrl: '',
  });

  const [splashSettings, setSplashSettings] = useState<SplashSettings>({
    title: 'Redirecting you soon! 🚀',
    message: 'You are being forwarded to our verified partner portal. Please wait 3 seconds...',
    countdownSeconds: 3,
    buttonText: 'Click here to proceed immediately',
    themeColor: '#4f46e5',
  });

  const [cloakSettings, setCloakSettings] = useState<CloakSettings>({
    pageTitle: 'Official Portal',
    showBanner: true,
    bannerNotice: '⚡ Viewing via SwitchLink Dynamic Router',
  });

  const [bioLinks, setBioLinks] = useState<Array<{ id: string; label: string; url: string }>>([
    { id: '1', label: '⭐ Visit Official Website', url: 'https://example.com' },
    { id: '2', label: '📱 Connect on Social Media', url: 'https://instagram.com' },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or Populate form
  useEffect(() => {
    if (linkToEdit) {
      setTitle(linkToEdit.title || '');
      setSlug(linkToEdit.slug || '');
      setDestinationUrl(linkToEdit.destinationUrl || '');
      setMode(linkToEdit.mode || 'direct');
      setTagsInput(linkToEdit.tags ? linkToEdit.tags.join(', ') : '');
      setNotes(linkToEdit.notes || '');
      setPassword(linkToEdit.password || '');
      setStatus(linkToEdit.status || 'active');
      if (linkToEdit.deviceRules) setDeviceRules(linkToEdit.deviceRules);
      if (linkToEdit.splashSettings) setSplashSettings(linkToEdit.splashSettings);
      if (linkToEdit.cloakSettings) setCloakSettings(linkToEdit.cloakSettings);
      if (linkToEdit.bioSettings?.links) setBioLinks(linkToEdit.bioSettings.links);
    } else {
      setTitle('');
      setSlug('');
      setDestinationUrl('https://');
      setMode('direct');
      setTagsInput('');
      setNotes('');
      setPassword('');
      setStatus('active');
      setDeviceRules({ iosUrl: '', androidUrl: '', desktopUrl: '' });
      setSplashSettings({
        title: 'Redirecting you soon! 🚀',
        message: 'You are being forwarded to the target portal. Please wait a moment...',
        countdownSeconds: 3,
        buttonText: 'Click here to proceed immediately',
        themeColor: '#4f46e5',
      });
      setCloakSettings({
        pageTitle: 'Official Portal',
        showBanner: true,
        bannerNotice: '⚡ Viewing via SwitchLink Dynamic Router',
      });
    }
    setError(null);
  }, [linkToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(normalizeSlug(e.target.value));
  };

  const handleAddBioLink = () => {
    setBioLinks([
      ...bioLinks,
      { id: Date.now().toString(), label: 'New Link Button', url: 'https://' },
    ]);
  };

  const handleRemoveBioLink = (id: string) => {
    setBioLinks(bioLinks.filter((b) => b.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate Destination URL
    const urlCheck = validateUrl(destinationUrl);
    if (!urlCheck.valid) {
      setError(urlCheck.error || 'Please enter a valid destination URL (e.g. https://example.com)');
      return;
    }

    const cleanedSlug = normalizeSlug(slug);

    const payload: Partial<RedirectLink> = {
      title: title.trim() || 'Untitled Link',
      slug: cleanedSlug,
      destinationUrl: urlCheck.formattedUrl,
      mode,
      status,
      password: password.trim() ? password.trim() : null,
      notes: notes.trim(),
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      deviceRules,
      splashSettings,
      cloakSettings,
      bioSettings: {
        links: bioLinks,
      },
    };

    setIsSubmitting(true);
    const success = await onSave(payload);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative overflow-hidden max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{isEditing ? '✏️' : '✨'}</span>
              <span>
                {isEditing
                  ? (lang === 'hi' ? 'डायनामिक लिंक एडिट करें' : 'Edit Dynamic Link')
                  : (lang === 'hi' ? 'नया डायनामिक लिंक बनाएं' : 'Create New Dynamic Link')}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'hi' 
                ? 'यह लिंक हमेशा के लिए बन जाएगा। आप जब चाहें इसका टारगेट URL बदल सकेंगे।' 
                : 'Permanent dynamic link. You can change what opens at this link anytime.'}
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              ⚠️ {error}
            </div>
          )}

          {/* Title & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                {lang === 'hi' ? 'लिंक का नाम / टाइटल *' : 'Link Title / Campaign Name *'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Festival Offer / Instagram Bio"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                {lang === 'hi' ? 'कस्टम स्लग (Custom Short Slug)' : 'Custom Short Slug'}
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2.5 bg-slate-800 border border-r-0 border-slate-700/80 rounded-l-xl text-xs text-slate-400 font-mono">
                  /r/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="promo-sale"
                  className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-r-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                Preview: <span className="text-indigo-400 font-mono">{origin}/r/{slug || 'random'}</span>
              </p>
            </div>
          </div>

          {/* Main Destination URL */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30">
            <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
              <span>🎯 {lang === 'hi' ? 'गंतव्य URL (Destination URL) *' : 'Target Destination URL *'}</span>
              <span className="text-[11px] font-normal lowercase text-indigo-400">
                {lang === 'hi' ? 'इसे बाद में कभी भी बदल सकते हैं' : 'can change anytime'}
              </span>
            </label>
            <input
              type="text"
              required
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://yourwebsite.com/product"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-indigo-500/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-mono"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              {lang === 'hi' 
                ? 'जब भी कोई इस लिंक पर जाएगा या QR कोड स्कैन करेगा, यह वेबसाइट खुलेगी।'
                : 'Whenever someone visits your dynamic URL or scans the QR code, this target opens.'}
            </p>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              {lang === 'hi' ? 'रीडायरेक्शन मोड चुनें' : 'Redirection Mode / Behavior'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {/* Direct */}
              <button
                type="button"
                onClick={() => setMode('direct')}
                className={`p-3 rounded-xl border text-left transition ${
                  mode === 'direct'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-400 mb-1">
                  <span>⚡</span>
                  <span>{lang === 'hi' ? 'डायरेक्ट 302' : 'Direct Redirect'}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {lang === 'hi' ? 'तुरंत टारगेट साइट पर भेजता है (फास्ट)' : 'Instant direct hop to target website.'}
                </p>
              </button>

              {/* Cloaked Frame */}
              <button
                type="button"
                onClick={() => setMode('cloak')}
                className={`p-3 rounded-xl border text-left transition ${
                  mode === 'cloak'
                    ? 'border-purple-500 bg-purple-500/10 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-purple-400 mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'मास्क्ड / फ्रेम' : 'Cloaked Frame'}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {lang === 'hi' ? 'एड्रेस बार में आपका URL ही रहेगा' : 'Keeps your URL in address bar with iframe.'}
                </p>
              </button>

              {/* Splash Countdown */}
              <button
                type="button"
                onClick={() => setMode('splash')}
                className={`p-3 rounded-xl border text-left transition ${
                  mode === 'splash'
                    ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-400 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'स्प्लैश स्क्रीन' : 'Splash Screen'}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {lang === 'hi' ? '3s काउंटडाउन और स्पेशल मैसेज' : 'Countdown timer & announcement message.'}
                </p>
              </button>

              {/* Smart Device */}
              <button
                type="button"
                onClick={() => setMode('device')}
                className={`p-3 rounded-xl border text-left transition ${
                  mode === 'device'
                    ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-cyan-400 mb-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'स्मार्ट डिवाइस' : 'Smart Device'}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {lang === 'hi' ? 'iPhone/Android के लिए अलग URL' : 'Route iPhone, Android & PC differently.'}
                </p>
              </button>

              {/* Bio Page */}
              <button
                type="button"
                onClick={() => setMode('bio')}
                className={`p-3 rounded-xl border text-left transition ${
                  mode === 'bio'
                    ? 'border-pink-500 bg-pink-500/10 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-pink-400 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'बायो पेज' : 'Micro-Bio Page'}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {lang === 'hi' ? 'सारे सोशल और जरूरी लिंक्स एक जगह' : 'Multi-link tree with profile & social buttons.'}
                </p>
              </button>
            </div>
          </div>

          {/* Conditional: Device Rules */}
          {mode === 'device' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3">
              <span className="text-xs font-semibold text-cyan-300 block">
                📱 {lang === 'hi' ? 'डिवाइस-वार टारगेट सेट करें' : 'Target URLs by Device'}
              </span>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">🍎 Apple iOS (iPhone/iPad):</label>
                <input
                  type="text"
                  value={deviceRules.iosUrl || ''}
                  onChange={(e) => setDeviceRules({ ...deviceRules, iosUrl: e.target.value })}
                  placeholder="https://apps.apple.com/app/your-app"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">🤖 Google Android:</label>
                <input
                  type="text"
                  value={deviceRules.androidUrl || ''}
                  onChange={(e) => setDeviceRules({ ...deviceRules, androidUrl: e.target.value })}
                  placeholder="https://play.google.com/store/apps/details?id=your.app"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">💻 Desktop / Fallback:</label>
                <input
                  type="text"
                  value={deviceRules.desktopUrl || ''}
                  onChange={(e) => setDeviceRules({ ...deviceRules, desktopUrl: e.target.value })}
                  placeholder="https://yourwebsite.com/desktop"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
                />
              </div>
            </div>
          )}

          {/* Conditional: Splash Screen Settings */}
          {mode === 'splash' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3">
              <span className="text-xs font-semibold text-amber-300 block">
                ⏳ {lang === 'hi' ? 'स्प्लैश स्क्रीन कॉन्फ़िगरेशन' : 'Splash Screen Settings'}
              </span>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Title / Headline:</label>
                <input
                  type="text"
                  value={splashSettings.title || ''}
                  onChange={(e) => setSplashSettings({ ...splashSettings, title: e.target.value })}
                  placeholder="Special Offer Loading..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Message / Notice:</label>
                <textarea
                  rows={2}
                  value={splashSettings.message || ''}
                  onChange={(e) => setSplashSettings({ ...splashSettings, message: e.target.value })}
                  placeholder="Exclusive deals for festival shoppers..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] text-slate-400 block mb-1">Countdown Seconds:</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={splashSettings.countdownSeconds || 3}
                    onChange={(e) => setSplashSettings({ ...splashSettings, countdownSeconds: parseInt(e.target.value, 10) || 3 })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Conditional: Bio Links */}
          {mode === 'bio' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-pink-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-pink-300 block">
                  ✨ {lang === 'hi' ? 'बायो पेज बटन्स' : 'Bio Page Buttons'}
                </span>
                <button
                  type="button"
                  onClick={handleAddBioLink}
                  className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'बटन जोड़ें' : 'Add Button'}</span>
                </button>
              </div>

              {bioLinks.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const updated = [...bioLinks];
                      updated[idx].label = e.target.value;
                      setBioLinks(updated);
                    }}
                    placeholder="Button Label"
                    className="w-1/3 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    value={item.url}
                    onChange={(e) => {
                      const updated = [...bioLinks];
                      updated[idx].url = e.target.value;
                      setBioLinks(updated);
                    }}
                    placeholder="https://link.com"
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveBioLink(item.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Advanced: Tags, Password, Notes */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {lang === 'hi' ? 'टैग्स (Tags, कॉमा से अलग करें)' : 'Tags (comma separated)'}
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="qr-flyer, instagram, client"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>{lang === 'hi' ? 'पासकोड सुरक्षा (वैकल्पिक)' : 'Passcode Protection (Optional)'}</span>
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. 1234 or secret"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSubmitting
                ? (lang === 'hi' ? 'सेव हो रहा है...' : 'Saving...')
                : isEditing
                ? (lang === 'hi' ? 'अपडेट सेव करें' : 'Save Changes')
                : (lang === 'hi' ? 'डायनामिक लिंक बनाएं' : 'Create Dynamic Link')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
