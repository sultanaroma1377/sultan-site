import { expect, test } from 'bun:test';
import { cleanShopContent } from './shop-content';
import type { SiteSettings } from './types';

const site: SiteSettings = { name: 'SULTAN AL MISK', tagline: 'Hand-blended perfumes inspired by gardens in bloom.', address: '12 Rosewood Lane, Mumbai 400001', phone: '+91 90000 00000', website: '#', locationLink: '#', social: { instagram: '#', facebook: '#', twitter: '#' } };

test('legacy sample business details become blank', () => {
  const cleaned = cleanShopContent(site, []).site;
  expect(cleaned.tagline).toBe('');
  expect(cleaned.address).toBe('');
  expect(cleaned.phone).toBe('');
  expect(cleaned.website).toBe('');
  expect(cleaned.locationLink).toBe('');
  expect(cleaned.social).toEqual({ instagram: '', facebook: '', twitter: '' });
});

test('only unchanged sample products are removed', () => {
  const sample = { id: 'p1', name: 'Rose Velvet', price: 2499, description: 'Bulgarian rose, soft musk, vanilla.', category: 'Floral' };
  expect(cleanShopContent(site, [sample]).products).toEqual([]);
  const edited = { ...sample, price: 3000 };
  const added = { ...sample, id: 'merchant-product' };
  expect(cleanShopContent(site, [edited, added]).products).toEqual([edited, added]);
});

test('merchant-entered shop details and logo are preserved', () => {
  const custom = { ...site, tagline: 'Our perfumes', address: 'My shop', phone: '12345', website: 'https://example.com', locationLink: 'https://example.com/location', social: { instagram: 'https://example.com/instagram' }, logo: 'uploaded-logo' };
  expect(cleanShopContent(custom, []).site).toEqual(custom);
});