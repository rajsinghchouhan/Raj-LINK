// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// src/utils/redirectLogic.ts
function normalizeSlug(input) {
  if (!input) return "";
  return input.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}
function validateUrl(url) {
  if (!url || typeof url !== "string") {
    return { valid: false, formattedUrl: "", error: "URL cannot be empty" };
  }
  let trimmed = url.trim();
  if (!trimmed) {
    return { valid: false, formattedUrl: "", error: "URL cannot be empty" };
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, formattedUrl: trimmed, error: "Only http and https protocols are supported" };
    }
    if (!parsed.hostname || !parsed.hostname.includes(".") && parsed.hostname !== "localhost") {
      return { valid: false, formattedUrl: trimmed, error: "Invalid hostname format" };
    }
    return { valid: true, formattedUrl: trimmed };
  } catch {
    return { valid: false, formattedUrl: trimmed, error: "Invalid URL format" };
  }
}
function detectDeviceType(userAgent) {
  if (!userAgent) return "desktop";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    return "tablet";
  }
  if (/iphone|ipod/i.test(ua)) {
    return "ios";
  }
  if (/android.*mobile/i.test(ua)) {
    return "android";
  }
  if (/macintosh|windows nt|linux/i.test(ua) && !/mobile/i.test(ua)) {
    return "desktop";
  }
  return "other";
}
function resolveDestination(link, context = {}) {
  const now = context.now || /* @__PURE__ */ new Date();
  if (link.status === "paused") {
    return {
      destinationUrl: link.destinationUrl,
      status: "paused",
      resolvedMode: link.mode,
      reason: "Link is currently paused by admin"
    };
  }
  if (link.expiresAt) {
    const expiry = new Date(link.expiresAt);
    if (now.getTime() > expiry.getTime()) {
      return {
        destinationUrl: link.destinationUrl,
        status: "expired",
        resolvedMode: link.mode,
        reason: "Link has expired"
      };
    }
  }
  if (link.password && link.password.trim().length > 0) {
    return {
      destinationUrl: link.destinationUrl,
      status: "password_required",
      resolvedMode: link.mode,
      reason: "Password protection enabled"
    };
  }
  let target = link.destinationUrl;
  if (link.mode === "device" && link.deviceRules && context.userAgent) {
    const deviceType = detectDeviceType(context.userAgent);
    if (deviceType === "ios" && link.deviceRules.iosUrl) {
      target = link.deviceRules.iosUrl;
    } else if (deviceType === "android" && link.deviceRules.androidUrl) {
      target = link.deviceRules.androidUrl;
    } else if (link.deviceRules.desktopUrl) {
      target = link.deviceRules.desktopUrl;
    }
  }
  return {
    destinationUrl: target,
    status: "ok",
    resolvedMode: link.mode,
    reason: "Routing to target"
  };
}

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
var isProduction = process.env.NODE_ENV === "production";
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
var DATA_DIR = path.join(__dirname, "data");
var LINKS_FILE = path.join(DATA_DIR, "links.json");
var CLICKS_FILE = path.join(DATA_DIR, "clicks.json");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
var INITIAL_LINKS = [
  {
    id: "link-promo-1",
    slug: "promo",
    title: "Festival Mega Sale / Packaging QR",
    destinationUrl: "https://wikipedia.org",
    createdAt: new Date(Date.now() - 36e5 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 36e5 * 12).toISOString(),
    status: "active",
    mode: "splash",
    tags: ["marketing", "flyer", "qr"],
    notes: "Printed on 5,000 brochures and packaging boxes. Destination can be swapped anytime!",
    clicks: 148,
    splashSettings: {
      title: "Festival Mega Offer! \u{1F389}",
      message: "You are being redirected to our exclusive promotional destination. Enjoy special gifts and discounts!",
      countdownSeconds: 4,
      buttonText: "Proceed to Target Website Now",
      showPreview: true,
      themeColor: "#4f46e5"
    }
  },
  {
    id: "link-insta-2",
    slug: "instagram",
    title: "Instagram Bio Link Router",
    destinationUrl: "https://instagram.com",
    createdAt: new Date(Date.now() - 36e5 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 36e5 * 4).toISOString(),
    status: "active",
    mode: "direct",
    tags: ["social", "bio"],
    notes: "Permanent link placed on Instagram and Twitter bios. Direct 302 instant redirect.",
    clicks: 420
  },
  {
    id: "link-device-3",
    slug: "app-download",
    title: "Mobile App Smart Router (iOS / Android / Web)",
    destinationUrl: "https://google.com",
    createdAt: new Date(Date.now() - 36e5 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 36e5 * 8).toISOString(),
    status: "active",
    mode: "device",
    tags: ["mobile", "app-store"],
    notes: "Smart device detection: iPhones go to App Store, Android phones go to Play Store, PC goes to Web Portal.",
    clicks: 295,
    deviceRules: {
      iosUrl: "https://apps.apple.com",
      androidUrl: "https://play.google.com/store",
      desktopUrl: "https://google.com"
    }
  },
  {
    id: "link-bio-4",
    slug: "my-links",
    title: "Personal Micro-Landing & Bio Page",
    destinationUrl: "https://example.com",
    createdAt: new Date(Date.now() - 36e5 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 36e5 * 2).toISOString(),
    status: "active",
    mode: "bio",
    tags: ["creator", "portfolio"],
    notes: "All-in-one link hub showing social icons and custom action buttons.",
    clicks: 86,
    bioSettings: {
      displayName: "Raj Singh Chouhan",
      bioText: "Creator, Developer & Tech Explorer \u{1F680} Click any link below to connect!",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      links: [
        { id: "b1", label: "\u2B50 Visit My Official Website", url: "https://example.com", icon: "star" },
        { id: "b2", label: "\u{1F4FA} Subscribe on YouTube", url: "https://youtube.com", icon: "video" },
        { id: "b3", label: "\u{1F4AC} Chat on WhatsApp / Telegram", url: "https://telegram.org", icon: "message" }
      ],
      socials: {
        youtube: "https://youtube.com",
        instagram: "https://instagram.com"
      }
    }
  },
  {
    id: "link-cloak-5",
    slug: "portfolio-masked",
    title: "Cloaked Frame Showcase",
    destinationUrl: "https://en.wikipedia.org/wiki/Special:Random",
    createdAt: new Date(Date.now() - 36e5 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 36e5 * 5).toISOString(),
    status: "active",
    mode: "cloak",
    tags: ["masked", "brand"],
    notes: "Loads destination inside a full-screen frame while keeping your brand URL in address bar.",
    clicks: 54,
    cloakSettings: {
      pageTitle: "Official Partner Showcase",
      showBanner: true,
      bannerNotice: "\u26A1 Viewing through SwitchLink Smart Router \u2014 URL stays masked"
    }
  }
];
function loadLinks() {
  try {
    if (fs.existsSync(LINKS_FILE)) {
      const data = fs.readFileSync(LINKS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading links file:", err);
  }
  saveLinks(INITIAL_LINKS);
  return INITIAL_LINKS;
}
function saveLinks(links) {
  try {
    fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving links file:", err);
  }
}
function loadClicks() {
  try {
    if (fs.existsSync(CLICKS_FILE)) {
      const data = fs.readFileSync(CLICKS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading clicks file:", err);
  }
  return [];
}
function saveClicks(clicks) {
  try {
    const trimmed = clicks.slice(-2e3);
    fs.writeFileSync(CLICKS_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving clicks file:", err);
  }
}
var linksStore = loadLinks();
var clicksStore = loadClicks();
function parseBrowser(ua) {
  if (/edg/i.test(ua)) return "Edge";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return "Safari";
  if (/opera|opr/i.test(ua)) return "Opera";
  return "Browser";
}
function parseOS(ua) {
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/macintosh|mac os x/i.test(ua)) return "macOS";
  if (/windows/i.test(ua)) return "Windows";
  if (/linux/i.test(ua)) return "Linux";
  return "Unknown OS";
}
app.get("/api/links", (req, res) => {
  res.json({ success: true, links: linksStore });
});
app.post("/api/links", (req, res) => {
  const { title, slug, destinationUrl, mode, tags, notes, deviceRules, splashSettings, bioSettings, cloakSettings, password, expiresAt } = req.body;
  const validCheck = validateUrl(destinationUrl);
  if (!validCheck.valid) {
    res.status(400).json({ success: false, error: validCheck.error || "Invalid destination URL" });
    return;
  }
  let finalSlug = normalizeSlug(slug || "");
  if (!finalSlug) {
    finalSlug = Math.random().toString(36).substring(2, 8);
  }
  const existing = linksStore.find((l) => l.slug.toLowerCase() === finalSlug.toLowerCase());
  if (existing) {
    res.status(409).json({ success: false, error: `Slug "${finalSlug}" is already in use. Please choose another.` });
    return;
  }
  const newLink = {
    id: "link-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    slug: finalSlug,
    title: (title || "Untitled Link").trim(),
    destinationUrl: validCheck.formattedUrl,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: "active",
    mode: mode || "direct",
    tags: Array.isArray(tags) ? tags.map((t) => t.trim()).filter(Boolean) : [],
    notes: notes || "",
    clicks: 0,
    deviceRules: deviceRules || {},
    splashSettings: splashSettings || {},
    bioSettings: bioSettings || { links: [] },
    cloakSettings: cloakSettings || {},
    password: password || null,
    expiresAt: expiresAt || null
  };
  linksStore.unshift(newLink);
  saveLinks(linksStore);
  res.status(201).json({ success: true, link: newLink });
});
app.patch("/api/links/:id/quick-url", (req, res) => {
  const { id } = req.params;
  const { destinationUrl } = req.body;
  const validCheck = validateUrl(destinationUrl);
  if (!validCheck.valid) {
    res.status(400).json({ success: false, error: validCheck.error || "Invalid destination URL" });
    return;
  }
  const index = linksStore.findIndex((l) => l.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: "Link not found" });
    return;
  }
  linksStore[index] = {
    ...linksStore[index],
    destinationUrl: validCheck.formattedUrl,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  saveLinks(linksStore);
  res.json({ success: true, link: linksStore[index], message: "Destination URL updated instantly!" });
});
app.put("/api/links/:id", (req, res) => {
  const { id } = req.params;
  const { title, slug, destinationUrl, mode, tags, notes, status, deviceRules, splashSettings, bioSettings, cloakSettings, password, expiresAt } = req.body;
  const index = linksStore.findIndex((l) => l.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: "Link not found" });
    return;
  }
  const validCheck = validateUrl(destinationUrl);
  if (!validCheck.valid) {
    res.status(400).json({ success: false, error: validCheck.error || "Invalid destination URL" });
    return;
  }
  let finalSlug = normalizeSlug(slug || linksStore[index].slug);
  if (!finalSlug) finalSlug = linksStore[index].slug;
  const collision = linksStore.find((l) => l.id !== id && l.slug.toLowerCase() === finalSlug.toLowerCase());
  if (collision) {
    res.status(409).json({ success: false, error: `Slug "${finalSlug}" is used by another link.` });
    return;
  }
  linksStore[index] = {
    ...linksStore[index],
    title: (title || linksStore[index].title).trim(),
    slug: finalSlug,
    destinationUrl: validCheck.formattedUrl,
    mode: mode || linksStore[index].mode,
    status: status || linksStore[index].status,
    tags: Array.isArray(tags) ? tags : linksStore[index].tags,
    notes: notes !== void 0 ? notes : linksStore[index].notes,
    deviceRules: deviceRules !== void 0 ? deviceRules : linksStore[index].deviceRules,
    splashSettings: splashSettings !== void 0 ? splashSettings : linksStore[index].splashSettings,
    bioSettings: bioSettings !== void 0 ? bioSettings : linksStore[index].bioSettings,
    cloakSettings: cloakSettings !== void 0 ? cloakSettings : linksStore[index].cloakSettings,
    password: password !== void 0 ? password : linksStore[index].password,
    expiresAt: expiresAt !== void 0 ? expiresAt : linksStore[index].expiresAt,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  saveLinks(linksStore);
  res.json({ success: true, link: linksStore[index] });
});
app.patch("/api/links/:id/toggle", (req, res) => {
  const { id } = req.params;
  const index = linksStore.findIndex((l) => l.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: "Link not found" });
    return;
  }
  const newStatus = linksStore[index].status === "active" ? "paused" : "active";
  linksStore[index].status = newStatus;
  linksStore[index].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveLinks(linksStore);
  res.json({ success: true, status: newStatus, link: linksStore[index] });
});
app.post("/api/links/batch", (req, res) => {
  const { action, ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ success: false, error: "Please provide an array of link ids" });
    return;
  }
  const idSet = new Set(ids);
  if (action === "activate" || action === "pause") {
    const targetStatus = action === "activate" ? "active" : "paused";
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let updatedCount = 0;
    linksStore = linksStore.map((link) => {
      if (idSet.has(link.id)) {
        updatedCount++;
        return { ...link, status: targetStatus, updatedAt: now };
      }
      return link;
    });
    saveLinks(linksStore);
    res.json({ success: true, action, count: updatedCount, links: linksStore });
    return;
  }
  if (action === "delete") {
    const beforeLen = linksStore.length;
    linksStore = linksStore.filter((link) => !idSet.has(link.id));
    const deletedCount = beforeLen - linksStore.length;
    saveLinks(linksStore);
    res.json({ success: true, action: "delete", count: deletedCount, links: linksStore });
    return;
  }
  res.status(400).json({ success: false, error: "Invalid batch action. Use activate, pause, or delete" });
});
app.delete("/api/links/:id", (req, res) => {
  const { id } = req.params;
  const initialLen = linksStore.length;
  linksStore = linksStore.filter((l) => l.id !== id);
  if (linksStore.length === initialLen) {
    res.status(404).json({ success: false, error: "Link not found" });
    return;
  }
  saveLinks(linksStore);
  res.json({ success: true, message: "Link deleted" });
});
app.get("/api/links/:id/analytics", (req, res) => {
  const { id } = req.params;
  const link = linksStore.find((l) => l.id === id);
  if (!link) {
    res.status(404).json({ success: false, error: "Link not found" });
    return;
  }
  const events = clicksStore.filter((c) => c.linkId === id || c.slug === link.slug);
  res.json({ success: true, link, clicks: events });
});
app.get("/api/analytics/global", (req, res) => {
  res.json({
    success: true,
    totalLinks: linksStore.length,
    activeLinks: linksStore.filter((l) => l.status === "active").length,
    pausedLinks: linksStore.filter((l) => l.status === "paused").length,
    totalClicks: linksStore.reduce((acc, l) => acc + (l.clicks || 0), 0),
    recentClicks: clicksStore.slice(-50).reverse()
  });
});
app.get("/api/export", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", 'attachment; filename="switchlink-backup.json"');
  res.json({
    version: "1.0",
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    links: linksStore,
    totalClicks: clicksStore.length
  });
});
app.post("/api/import", (req, res) => {
  const { links } = req.body;
  if (!Array.isArray(links)) {
    res.status(400).json({ success: false, error: "Invalid links array" });
    return;
  }
  linksStore = links;
  saveLinks(linksStore);
  res.json({ success: true, count: linksStore.length, message: "Links imported successfully" });
});
app.post("/api/reset-demo", (req, res) => {
  linksStore = JSON.parse(JSON.stringify(INITIAL_LINKS));
  saveLinks(linksStore);
  res.json({ success: true, links: linksStore, message: "Demo links restored" });
});
function handleDynamicRedirect(req, res) {
  const rawSlug = req.params.slug;
  const slug = normalizeSlug(rawSlug);
  const link = linksStore.find((l) => l.slug.toLowerCase() === slug.toLowerCase());
  if (!link) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Link Not Found - SwitchLink</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div class="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">404</div>
          <h1 class="text-2xl font-bold mb-2">Dynamic Link Not Found</h1>
          <p class="text-slate-400 mb-6">The link <code class="bg-slate-800 px-2 py-0.5 rounded text-amber-300">/r/${slug}</code> does not exist or has been removed.</p>
          <a href="/" class="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition">
            Go to SwitchLink Dashboard
          </a>
        </div>
      </body>
      </html>
    `);
    return;
  }
  const userAgent = req.headers["user-agent"] || "";
  const referrer = req.headers["referer"] || req.headers["referrer"] || "Direct Visit";
  const resolution = resolveDestination(link, { userAgent });
  const clickEvent = {
    id: "clk-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    linkId: link.id,
    slug: link.slug,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    userAgent,
    device: detectDeviceType(userAgent),
    browser: parseBrowser(userAgent),
    os: parseOS(userAgent),
    referrer: String(referrer),
    targetDestination: resolution.destinationUrl
  };
  clicksStore.push(clickEvent);
  saveClicks(clicksStore);
  link.clicks = (link.clicks || 0) + 1;
  saveLinks(linksStore);
  if (resolution.status === "paused") {
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Link Temporarily Paused - SwitchLink</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans">
        <div class="max-w-md w-full bg-slate-900 border border-amber-500/30 rounded-2xl p-8 text-center shadow-2xl">
          <div class="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">\u23F8\uFE0F</div>
          <span class="inline-block px-3 py-1 bg-amber-500/10 text-amber-300 text-xs font-semibold rounded-full mb-3 uppercase tracking-wider">Link Paused</span>
          <h1 class="text-2xl font-bold mb-2">${link.title}</h1>
          <p class="text-slate-400 text-sm mb-6">This dynamic URL has been temporarily paused by its creator. Please check back later or contact the owner.</p>
          <div class="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-xs text-slate-400 mb-6 font-mono">
            URL: /r/${link.slug}
          </div>
          <a href="/" class="inline-flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition">
            Admin Dashboard
          </a>
        </div>
      </body>
      </html>
    `);
    return;
  }
  if (resolution.status === "password_required") {
    const providedPass = req.query.pwd || req.body?.pwd;
    if (providedPass !== link.password) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>Password Protected Link - SwitchLink</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
          <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
            <div class="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">\u{1F512}</div>
            <h1 class="text-xl font-bold mb-1">Protected Dynamic Link</h1>
            <p class="text-slate-400 text-sm mb-6">Enter the passcode to access this destination.</p>
            <form method="GET" action="/r/${link.slug}" class="space-y-4">
              <div>
                <input type="password" name="pwd" required placeholder="Enter passcode"
                  class="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center text-lg tracking-widest text-white focus:outline-none focus:border-indigo-500">
              </div>
              <button type="submit" class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition">
                Unlock & Proceed
              </button>
            </form>
          </div>
        </body>
        </html>
      `);
      return;
    }
  }
  const target = resolution.destinationUrl;
  if (link.mode === "cloak") {
    const pageTitle = link.cloakSettings?.pageTitle || link.title || "Dynamic Portal";
    const showBanner = link.cloakSettings?.showBanner !== false;
    const bannerNotice = link.cloakSettings?.bannerNotice || "Viewing via SwitchLink Dynamic Router";
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${pageTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body, html { width: 100%; height: 100%; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; }
          .banner {
            height: 38px;
            background: #0f172a;
            color: #94a3b8;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            font-size: 13px;
            border-bottom: 1px solid #1e293b;
          }
          .banner a { color: #6366f1; text-decoration: none; font-weight: 500; }
          .banner a:hover { text-decoration: underline; }
          iframe {
            width: 100%;
            height: ${showBanner ? "calc(100% - 38px)" : "100%"};
            border: none;
          }
        </style>
      </head>
      <body>
        ${showBanner ? `
        <div class="banner">
          <div><span>\u{1F6E1}\uFE0F ${bannerNotice}</span></div>
          <div><a href="${target}" target="_blank" rel="noopener">Open Directly \u2197</a></div>
        </div>
        ` : ""}
        <iframe src="${target}" title="${pageTitle}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </body>
      </html>
    `);
    return;
  }
  if (link.mode === "splash") {
    const splash = link.splashSettings || {};
    const splashTitle = splash.title || `Forwarding to ${link.title}`;
    const splashMessage = splash.message || "You will be redirected automatically in a moment...";
    const countdown = splash.countdownSeconds || 3;
    const btnText = splash.buttonText || "Click here to proceed immediately";
    const themeColor = splash.themeColor || "#4f46e5";
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${splashTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          let seconds = ${countdown};
          const targetUrl = ${JSON.stringify(target)};
          function updateTimer() {
            const el = document.getElementById('timer-count');
            const bar = document.getElementById('progress-bar');
            if (el) el.textContent = seconds;
            if (bar) bar.style.width = ((seconds / ${countdown}) * 100) + '%';
            if (seconds <= 0) {
              window.location.href = targetUrl;
            } else {
              seconds--;
              setTimeout(updateTimer, 1000);
            }
          }
          window.onload = function() {
            setTimeout(updateTimer, 1000);
          };
        </script>
      </head>
      <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans">
        <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
            <div id="progress-bar" class="h-full bg-indigo-500 transition-all duration-1000" style="width: 100%"></div>
          </div>
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg shadow-indigo-500/20" style="background-color: ${themeColor}">
            \u{1F680}
          </div>
          <h1 class="text-2xl font-bold mb-3">${splashTitle}</h1>
          <p class="text-slate-400 text-sm mb-6 leading-relaxed">${splashMessage}</p>

          <div class="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 mb-6">
            <div class="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Redirecting In</div>
            <div class="text-4xl font-extrabold text-indigo-400"><span id="timer-count">${countdown}</span>s</div>
          </div>

          <a href="${target}" class="block w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/30">
            ${btnText}
          </a>

          <p class="text-xs text-slate-500 mt-4 break-all">
            Target: <span class="text-slate-400">${target}</span>
          </p>
        </div>
      </body>
      </html>
    `);
    return;
  }
  if (link.mode === "bio") {
    const bio = link.bioSettings || { links: [] };
    const displayName = bio.displayName || link.title;
    const bioText = bio.bioText || "Welcome! Choose a link below:";
    const avatar = bio.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop";
    const linksList = bio.links || [];
    const linksHtml = linksList.map((item) => `
      <a href="${item.url}" target="_blank" rel="noopener" class="flex items-center justify-between w-full px-5 py-4 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-2xl transition group text-left">
        <span class="font-medium text-slate-100 group-hover:text-white">${item.label}</span>
        <span class="text-slate-400 group-hover:translate-x-1 transition">\u2197</span>
      </a>
    `).join("");
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${displayName} - SwitchLink Bio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-950 text-slate-100 min-h-screen py-12 px-4 flex justify-center font-sans">
        <div class="max-w-md w-full space-y-6 text-center">
          <img src="${avatar}" alt="${displayName}" class="w-24 h-24 rounded-full mx-auto border-4 border-indigo-500/30 shadow-xl object-cover" />
          <div>
            <h1 class="text-2xl font-bold">${displayName}</h1>
            <p class="text-slate-400 text-sm mt-1 max-w-sm mx-auto">${bioText}</p>
          </div>

          <div class="space-y-3 pt-2">
            ${linksHtml}
          </div>

          <div class="pt-6 border-t border-slate-800/80">
            <span class="text-xs text-slate-500">Powered by SwitchLink Dynamic Router</span>
          </div>
        </div>
      </body>
      </html>
    `);
    return;
  }
  res.redirect(302, target);
}
app.get("/r/:slug", handleDynamicRedirect);
app.get("/go/:slug", handleDynamicRedirect);
app.get("/l/:slug", handleDynamicRedirect);
app.get("/qr/:slug", handleDynamicRedirect);
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} SwitchLink Server running at http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
