import type { Product } from './types';
import type { EcoVariant } from './sheet-mapping';

export function productImage(product: Pick<Product, 'image' | 'variantLabel'> | undefined, sizes: EcoVariant[] = []) {
  if (!product) return undefined;
  return product.image ?? (product.variantLabel ? sizes.find(size => size.label === product.variantLabel)?.image : undefined);
}