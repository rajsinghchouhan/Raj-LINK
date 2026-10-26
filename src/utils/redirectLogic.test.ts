import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSlug,
  validateUrl,
  detectDeviceType,
  resolveDestination,
  filterLinks,
  calculateAggregateStats,
  batchUpdateStatus,
  batchDeleteLinks,
} from './redirectLogic';
import { RedirectLink } from '../types/link';

test('normalizeSlug cleans special characters and slashes', () => {
  assert.equal(normalizeSlug('/My-Awesome_Product/'), 'my-awesome_product');
  assert.equal(normalizeSlug('  summer sale 2026!  '), 'summer-sale-2026');
  assert.equal(normalizeSlug('hello///world'), 'hello-world');
  assert.equal(normalizeSlug(''), '');
});

test('validateUrl validates and prepends protocol', () => {
  const result1 = validateUrl('github.com/myrepo');
  assert.equal(result1.valid, true);
  assert.equal(result1.formattedUrl, 'https://github.com/myrepo');

  const result2 = validateUrl('https://example.com/deep/path?ref=qr');
  assert.equal(result2.valid, true);
  assert.equal(result2.formattedUrl, 'https://example.com/deep/path?ref=qr');

  const result3 = validateUrl('   ');
  assert.equal(result3.valid, false);

  const result4 = validateUrl('not a valid url here');
  assert.equal(result4.valid, false);
});

test('detectDeviceType detects iOS, Android, and Desktop from user agents', () => {
  const iosUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15';
  assert.equal(detectDeviceType(iosUa), 'ios');

  const androidUa = 'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 Mobile Safari/537.36';
  assert.equal(detectDeviceType(androidUa), 'android');

  const desktopMacUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
  assert.equal(detectDeviceType(desktopMacUa), 'desktop');
});

test('resolveDestination respects status, device rules, and expiration', () => {
  const baseLink: RedirectLink = {
    id: 'link-1',
    slug: 'app',
    title: 'Mobile App Download',
    destinationUrl: 'https://mysite.com/default',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    mode: 'device',
    tags: ['mobile'],
    clicks: 12,
    deviceRules: {
      iosUrl: 'https://apps.apple.com/app/my-app',
      androidUrl: 'https://play.google.com/store/apps/details?id=my.app',
      desktopUrl: 'https://mysite.com/desktop-landing',
    },
  };

  // Test iOS resolution
  const iosRes = resolveDestination(baseLink, {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)',
  });
  assert.equal(iosRes.status, 'ok');
  assert.equal(iosRes.destinationUrl, 'https://apps.apple.com/app/my-app');

  // Test Android resolution
  const androidRes = resolveDestination(baseLink, {
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) Mobile Safari/537.36',
  });
  assert.equal(androidRes.status, 'ok');
  assert.equal(androidRes.destinationUrl, 'https://play.google.com/store/apps/details?id=my.app');

  // Test paused link
  const pausedLink: RedirectLink = { ...baseLink, status: 'paused' };
  const pausedRes = resolveDestination(pausedLink);
  assert.equal(pausedRes.status, 'paused');

  // Test expired link
  const expiredLink: RedirectLink = {
    ...baseLink,
    expiresAt: new Date(Date.now() - 100000).toISOString(),
  };
  const expiredRes = resolveDestination(expiredLink);
  assert.equal(expiredRes.status, 'expired');
});

test('filterLinks and calculateAggregateStats work as expected', () => {
  const links: RedirectLink[] = [
    {
      id: '1',
      slug: 'offer',
      title: 'Summer Offer',
      destinationUrl: 'https://shop.com/sale',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      mode: 'direct',
      tags: ['promo'],
      clicks: 45,
    },
    {
      id: '2',
      slug: 'insta-bio',
      title: 'Instagram Bio',
      destinationUrl: 'https://bio.link/raj',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'paused',
      mode: 'bio',
      tags: ['social'],
      clicks: 15,
    },
  ];

  const searchFiltered = filterLinks(links, 'offer');
  assert.equal(searchFiltered.length, 1);
  assert.equal(searchFiltered[0].slug, 'offer');

  const stats = calculateAggregateStats(links);
  assert.equal(stats.totalLinks, 2);
  assert.equal(stats.activeLinks, 1);
  assert.equal(stats.pausedLinks, 1);
  assert.equal(stats.totalClicks, 60);
  assert.equal(stats.mostActiveLink?.slug, 'offer');
});

test('batchUpdateStatus activates or pauses matching links', () => {
  const items: RedirectLink[] = [
    { id: 'l1', slug: 's1', title: 'T1', destinationUrl: 'https://a.com', status: 'active', mode: 'direct', createdAt: '', updatedAt: '', tags: [], clicks: 0 },
    { id: 'l2', slug: 's2', title: 'T2', destinationUrl: 'https://b.com', status: 'active', mode: 'direct', createdAt: '', updatedAt: '', tags: [], clicks: 0 },
    { id: 'l3', slug: 's3', title: 'T3', destinationUrl: 'https://c.com', status: 'paused', mode: 'direct', createdAt: '', updatedAt: '', tags: [], clicks: 0 },
  ];

  const paused = batchUpdateStatus(items, ['l1', 'l2'], 'paused');
  assert.equal(paused[0].status, 'paused');
  assert.equal(paused[1].status, 'paused');
  assert.equal(paused[2].status, 'paused');

  const activated = batchUpdateStatus(paused, ['l1', 'l3'], 'active');
  assert.equal(activated[0].status, 'active');
  assert.equal(activated[1].status, 'paused');
  assert.equal(activated[2].status, 'active');
});

test('batchDeleteLinks removes only target ids', () => {
  const items: RedirectLink[] = [
    { id: 'l1', slug: 's1', title: 'T1', destinationUrl: 'https://a.com', status: 'active', mode: 'direct', createdAt: '', updatedAt: '', tags: [], clicks: 0 },
    { id: 'l2', slug: 's2', title: 'T2', destinationUrl: 'https://b.com', status: 'active', mode: 'direct', createdAt: '', updatedAt: '', tags: [], clicks: 0 },
    { id: 'l3', slug: 's3', title: 'T3', destinationUrl: 'https://c.com', status: 'paused', mode: 'direct', createdAt: '', updatedAt: '', tags: [], clicks: 0 },
  ];

  const remaining = batchDeleteLinks(items, ['l2']);
  assert.equal(remaining.length, 2);
  assert.equal(remaining.some((l) => l.id === 'l2'), false);
  assert.equal(remaining.some((l) => l.id === 'l1'), true);
  assert.equal(remaining.some((l) => l.id === 'l3'), true);
});

