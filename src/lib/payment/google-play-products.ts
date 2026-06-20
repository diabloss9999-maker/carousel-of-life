export type PaidPlanKey = "lite" | "pro";

export const GOOGLE_PLAY_PRODUCTS: Record<
  PaidPlanKey,
  { productId: string; label: string }
> = {
  lite: {
    productId: "rider_light_monthly",
    label: "Rider Light",
  },
  pro: {
    productId: "rider_pro_monthly",
    label: "Rider Pro",
  },
};

export function planFromGooglePlayProductId(
  productId: string,
): PaidPlanKey | null {
  if (productId === GOOGLE_PLAY_PRODUCTS.lite.productId) return "lite";
  if (productId === GOOGLE_PLAY_PRODUCTS.pro.productId) return "pro";
  return null;
}
