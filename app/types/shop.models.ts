// ─────────────────────────────────────────────
// Colors
// ─────────────────────────────────────────────
export interface FamilyColor {
  id: number;
  name: string;
  code: string;
}

export interface FamilyColorChild {
  id: number;
  family_color_id: number;
  name: string;
  code: string;
}

// ─────────────────────────────────────────────
// Product color variants
// ─────────────────────────────────────────────
export interface GalleryImage {
  id: number;
  product_color_variant_id: number;
  image_url: string;
  type: string;
  sort_order: number;
}

export interface SizeStock {
  id: number;
  product_color_variant_id: number;
  size: string;
  sku: string;
  price: number;
  stock: number;
}

export interface ColorVariant {
  id: number;
  product_id: number;
  family_color_id: number;
  family_color_child_id: number | null;
  color_id?: number | null;
  // legacy field — current API always sends this as null, kept optional for safety
  color?: { code: string; name?: string } | null;
  family_color?: FamilyColor;
  family_color_child?: FamilyColorChild | null;
  gallery_images: GalleryImage[];
  thumbnail_image: GalleryImage | null;
  size_stocks: SizeStock[];
}

// ─────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  type: string;
  parent_id?: number | null;
  order_level?: number;
  banner_path?: string | null;
  icon_path?: string | null;
  cover_path?: string | null;
}

export interface CategoryItem {
  id: number;
  name: string;
  type: string;
  parent_id: number | null;
  order_level: number;
  banner_path: string | null;
  icon_path: string | null;
  cover_path: string | null;
  banner_url: string | null;
  icon_url: string | null;
  cover_url: string | null;
  total_sold?: number;
  distinct_products_sold?: number;
  is_fallback?: boolean;
}

export interface BannerCategory {
  id: number;
  name: string;
}

// ─────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────
export interface ProductItem {
  id: number;
  name: string; // API field (was "title")
  brand: string;
  unit: string;
  weight: string;
  min_qty: number;
  tags: string;
  description: string;
  spotlight_image: string; // API field (was "image")
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  category_id: number;
  category?: Category;
  unit_price: string; // MRP, sent as string e.g. "299.00"
  discount: string;
  discount_type: "flat" | "percentage";
  discount_start_date?: string;
  discount_end_date?: string;
  effective_price: number; // sale/discounted price (was "sp")
  reward_points: number;
  is_flash_sale: boolean;
  flash_sale_title?: string | null;
  flash_sale_discount?: string;
  flash_sale_discount_type?: string | null;
  is_today_sale: boolean;
  is_published: boolean;
  is_active: boolean;
  total_sold: number;
  is_fallback?: boolean;
  is_wishlisted: boolean;
  created_at?: string;
  updated_at?: string;

  // Not always present in every API response — keep optional
  rating?: number;
  review?: number;
  badge?: string;

  color_variants?: ColorVariant[];
}

// ─────────────────────────────────────────────
// Collections / Reels / Banners
// ─────────────────────────────────────────────
export interface CollectionItem {
  id: number;
  name?: string;
  img: string;
  slug?: string;
  category?: {
    id: number;
    name: string;k
  };
}

export interface ReelItem {
  id: number;
  title?: string;
  video_url?: string;
  thumbnail_url?: string;
  is_published?: boolean;
  [key: string]: any;
}

export interface Banner {
  id: number;
  title: string;
  web_banner_path: string;
  mobile_banner_path: string;
  order_level: number;
  status: boolean;
  web_banner_url: string;
  mobile_banner_url: string;
  categories: BannerCategory[];
}

// ADD THESE to app/types/shop.models.ts (alongside your existing CategoryItem,
// ProductItem, CollectionItem, ReelItem, Banner interfaces)

export interface SpotlightItem {
  id: number;
  title: string;
  product_id: number;
  image: string;
  image_url: string;
  is_published: boolean;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  product: {
    id: number;
    name: string;
    unit_price: string;
    effective_price: number;
  };
}

export interface BlogItem {
  id: number;
  title: string;
  sub_title: string;
  description_1: string;
  description_2: string;
  description_3: string;
  cover_image_path: string;
  cover_image_url: string;
  product_id: number;
  is_published: boolean;
  published_at: string;
  created_at?: string;
  updated_at?: string;
  product?: {
    id: number;
    name: string;
    [key: string]: any;
  };
}
