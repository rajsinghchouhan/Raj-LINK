/**
 * Type definitions for SwitchLink Dynamic Redirect & QR Hub
 */

export type RedirectMode = 'direct' | 'cloak' | 'splash' | 'device' | 'bio';

export interface DeviceRules {
  iosUrl?: string;
  androidUrl?: string;
  desktopUrl?: string;
}

export interface SplashSettings {
  title?: string;
  message?: string;
  countdownSeconds?: number;
  buttonText?: string;
  showPreview?: boolean;
  themeColor?: string;
  logoUrl?: string;
}

export interface BioLinkItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
}

export interface BioSettings {
  avatarUrl?: string;
  displayName?: string;
  bioText?: string;
  links: BioLinkItem[];
  socials?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
    youtube?: string;
  };
}

export interface CloakSettings {
  pageTitle?: string;
  favicon?: string;
  bannerNotice?: string;
  showBanner?: boolean;
}

export interface RedirectLink {
  id: string;
  slug: string;
  title: string;
  destinationUrl: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'paused';
  mode: RedirectMode;
  password?: string | null;
  expiresAt?: string | null;
  tags: string[];
  notes?: string;
  clicks: number;
  deviceRules?: DeviceRules;
  splashSettings?: SplashSettings;
  bioSettings?: BioSettings;
  cloakSettings?: CloakSettings;
  forwardQueryParams?: boolean;
}

export interface ClickEvent {
  id: string;
  linkId: string;
  slug: string;
  timestamp: string;
  userAgent: string;
  device: 'ios' | 'android' | 'desktop' | 'tablet' | 'other';
  browser: string;
  os: string;
  referrer: string;
  ip?: string;
  targetDestination: string;
}

export interface AggregateStats {
  totalLinks: number;
  activeLinks: number;
  pausedLinks: number;
  totalClicks: number;
  deviceCounts: {
    mobile: number;
    desktop: number;
    tablet: number;
    other: number;
  };
  mostActiveLink?: {
    id: string;
    title: string;
    slug: string;
    clicks: number;
  };
}
