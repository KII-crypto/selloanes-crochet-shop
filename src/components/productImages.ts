import small from "@/assets/product-small.jpg";
import medium from "@/assets/product-medium.jpg";
import large from "@/assets/product-large.jpg";
import hero from "@/assets/hero-scrunchies.jpg";

export const PRODUCT_IMAGES: Record<string, string> = { small, medium, large };

export function productImage(slug: string): string {
  return PRODUCT_IMAGES[slug] ?? hero;
}
