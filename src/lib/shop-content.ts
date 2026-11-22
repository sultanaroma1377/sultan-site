import type { Product, SiteSettings } from './types';

// Only remove exact legacy sample values; merchant-entered content is retained.
const sampleProducts = new Map([
  ['p1', ['Rose Velvet', 2499, 'Bulgarian rose, soft musk, vanilla.', 'Floral']],
  ['p2', ['Jasmine Noir', 2899, 'Night-blooming jasmine and oud.', 'Floral']],
  ['p3', ['Cedar Bloom', 2299, 'Cedarwood, bergamot, white tea.', 'Woody']],
  ['p4', ['Peony Mist', 1999, 'Peony, peach, soft amber.', 'Floral']],
  ['p5', ['Amber Reverie', 3199, 'Warm amber, sandalwood, saffron.', 'Oriental']],
  ['p6', ['Citrus Garden', 1799, 'Yuzu, neroli, green leaves.', 'Citrus']],
]);

export function cleanShopContent(site: SiteSettings, products: Product[]) {
  return {
    site: {
      ...site,
      tagline: site.tagline === 'Hand-blended perfumes inspired by gardens in bloom.' ? '' : site.tagline,
      address: site.address === '12 Rosewood Lane, Mumbai 400001' ? '' : site.address,
      phone: site.phone === '+91 90000 00000' ? '' : site.phone,
      website: site.website === '#' ? '' : site.website,
      locationLink: site.locationLink === '#' ? '' : site.locationLink,
      social: Object.fromEntries(Object.entries(site.social).map(([key, value]) => [key, value === '#' ? '' : value])),
    },
    products: products.filter(p => {
      const sample = sampleProducts.get(p.id);
      return !sample || p.name !== sample[0] || p.price !== sample[1] || p.description !== sample[2] || p.category !== sample[3] || Boolean(p.image || p.parentId || p.variantLabel || p.buyingPrice);
    }),
  };
}