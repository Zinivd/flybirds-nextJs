// app/lib/checkout-store.ts
export interface CheckoutSummaryItem {
  name: string;
  qty: number;
  price: number;
  mrp: number;
  discountType: "flat" | "percent" | null;
  discountValue: number;
  image: string;
  size: string;
  productId: number;
  productColorVariantId: number | null;
  productSizeStockId: number | null;
}

export interface CheckoutOrderSummary {
  items: CheckoutSummaryItem[];
  subtotal: number;
  discountAmount: number;
  shippingCharge: number;
  taxAmount: number;
  total: number;
  couponCode?: string;
}

const KEY = "checkoutOrderSummary";

export function setOrderSummary(summary: CheckoutOrderSummary): void {
  sessionStorage.setItem(KEY, JSON.stringify(summary));
}

export function getOrderSummary(): CheckoutOrderSummary | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearOrderSummary(): void {
  sessionStorage.removeItem(KEY);
}
