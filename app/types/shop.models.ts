// app/types/shop.models.ts
export interface ColorVariant {
  color: { code: string; name?: string };
  gallery_images?: { image_url: string; sort_order: number }[];
}

export interface CategoryItem {
  id: number;
  name: string;
  banner_url: string;
}

export interface ProductItem {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  rating: number;
  review: number;
  sp: number;
  mrp: number;
  badge: string;
  color_variants: ColorVariant[];
  category_id: number;
}

export interface CollectionItem {
  id: number;
  name: string;
  img: string;
  slug: string;
}

export interface ReelItem {
  id: number;
  title: string;
  video_url: string;
}

export interface Banner {
  id: number;
  title: string;
  web_banner_url: string;
  mobile_banner_url: string;
}
