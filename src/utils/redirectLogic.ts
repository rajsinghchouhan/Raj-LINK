import type { RedirectLink, ClickEvent, AggregateStats } from '../types/link.ts';

/**
 * Clean and normalize a slug.
 * Removes leading/trailing slashes, spaces, converts to lowercase alphanumeric + dashes.
 */
export function normalizeSlug(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validate and format a destination URL.
 * Automatically prepends https:// if protocol is missing.
 */
export function validateUrl(url: string): { valid: boolean; formattedUrl: string; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, formattedUrl: '', error: 'URL cannot be empty' };
  }

  let trimmed = url.trim();
  if (!trimmed) {
    return { valid: false, formattedUrl: '', error: 'URL cannot be empty' };
  }

  // Prepend https:// if not starting with http:// or https://
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, formattedUrl: trimmed, error: 'Only http and https protocols are supported' };
    }
    // Check for valid hostname with dot or localhost
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return { valid: false, formattedUrl: trimmed, error: 'Invalid hostname format' };
    }
    return { valid: true, formattedUrl: trimmed };
  } catch {
    return { valid: false, formattedUrl: trimmed, error: 'Invalid URL format' };
  }
}

/**
 * Detect client device category from User-Agent string.
 */
export function detectDeviceType(userAgent: string): 'ios' | 'android' | 'desktop' | 'tablet' | 'other' {
  if (!userAgent) return 'desktop';
  const ua = userAgent.toLowerCase();

  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    return 'tablet';
  }
  if (/iphone|ipod/i.test(ua)) {
    return 'ios';
  }
  if (/android.*mobile/i.test(ua)) {
    return 'android';
  }
  if (/macintosh|windows nt|linux/i.test(ua) && !/mobile/i.test(ua)) {
    return 'desktop';
  }
  return 'other';
}

/**
 * Resolve target destination based on link settings, device rules, and schedule.
 */
export function resolveDestination(
  link: RedirectLink,
  context: { userAgent?: string; now?: Date } = {}
): {
  destinationUrl: string;
  status: 'ok' | 'paused' | 'expired' | 'password_required';
  resolvedMode: string;
  reason: string;
} {
  const now = context.now || new Date();

  // 1. Check if paused
  if (link.status === 'paused') {
    return {
      destinationUrl: link.destinationUrl,
      status: 'paused',
      resolvedMode: link.mode,
      reason: 'Link is currently paused by admin',
    };
  }

  // 2. Check expiration
  if (link.expiresAt) {
    const expiry = new Date(link.expiresAt);
    if (now.getTime() > expiry.getTime()) {
      return {
        destinationUrl: link.destinationUrl,
        status: 'expired',
        resolvedMode: link.mode,
        reason: 'Link has expired',
      };
    }
  }

  // 3. Check password requirement
  if (link.password && link.password.trim().length > 0) {
    return {
      destinationUrl: link.destinationUrl,
      status: 'password_required',
      resolvedMode: link.mode,
      reason: 'Password protection enabled',
    };
  }

  // 4. Check device rules if mode is 'device'
  let target = link.destinationUrl;
  if (link.mode === 'device' && link.deviceRules && context.userAgent) {
    const deviceType = detectDeviceType(context.userAgent);
    if (deviceType === 'ios' && link.deviceRules.iosUrl) {
      target = link.deviceRules.iosUrl;
    } else if (deviceType === 'android' && link.deviceRules.androidUrl) {
      target = link.deviceRules.androidUrl;
    } else if (link.deviceRules.desktopUrl) {
      target = link.deviceRules.desktopUrl;
    }
  }

  return {
    destinationUrl: target,
    status: 'ok',
    resolvedMode: link.mode,
    reason: 'Routing to target',
  };
}

/**
 * Filter links by search text, status, and mode/tag
 */
export function filterLinks(
  links: RedirectLink[],
  query: string,
  statusFilter: string = 'all',
  modeFilter: string = 'all'
): RedirectLink[] {
  const q = query.toLowerCase().trim();

  return links.filter((link) => {
    // Status filter
    if (statusFilter !== 'all' && link.status !== statusFilter) {
      return false;
    }

    // Mode filter
    if (modeFilter !== 'all' && link.mode !== modeFilter) {
      return false;
    }

    // Search query
    if (q) {
      const matchSlug = link.slug.toLowerCase().includes(q);
      const matchTitle = link.title.toLowerCase().includes(q);
      const matchDest = link.destinationUrl.toLowerCase().includes(q);
      const matchTags = link.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchSlug && !matchTitle && !matchDest && !matchTags) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculate dashboard aggregate stats from links and click logs
 */
export function calculateAggregateStats(
  links: RedirectLink[],
  clickLogs: ClickEvent[] = []
): AggregateStats {
  const totalLinks = links.length;
  const activeLinks = links.filter((l) => l.status === 'active').length;
  const pausedLinks = links.filter((l) => l.status === 'paused').length;
  const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);

  const deviceCounts = {
    mobile: 0,
    desktop: 0,
    tablet: 0,
    other: 0,
  };

  for (const event of clickLogs) {
    if (event.device === 'ios' || event.device === 'android') {
      deviceCounts.mobile++;
    } else if (event.device === 'desktop') {
      deviceCounts.desktop++;
    } else if (event.device === 'tablet') {
      deviceCounts.tablet++;
    } else {
      deviceCounts.other++;
    }
  }

  // Find most active link
  let mostActiveLink: AggregateStats['mostActiveLink'] = undefined;
  if (links.length > 0) {
    const sorted = [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
    if (sorted[0] && sorted[0].clicks > 0) {
      mostActiveLink = {
        id: sorted[0].id,
        title: sorted[0].title,
        slug: sorted[0].slug,
        clicks: sorted[0].clicks,
      };
    }
  }

  return {
    totalLinks,
    activeLinks,
    pausedLinks,
    totalClicks,
    deviceCounts,
    mostActiveLink,
  };
}

/**
 * Batch update status for specified link IDs
 */
export function batchUpdateStatus(
  links: RedirectLink[],
  targetIds: string[],
  newStatus: 'active' | 'paused'
): RedirectLink[] {
  const idSet = new Set(targetIds);
  const now = new Date().toISOString();
  return links.map((l) => {
    if (idSet.has(l.id)) {
      return { ...l, status: newStatus, updatedAt: now };
    }
    return l;
  });
}

/**
 * Batch delete specified link IDs
 */
export function batchDeleteLinks(
  links: RedirectLink[],
  targetIds: string[]
): RedirectLink[] {
  const idSet = new Set(targetIds);
  return links.filter((l) => !idSet.has(l.id));
}

