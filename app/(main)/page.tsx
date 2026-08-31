// app/(main)/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Category from "@/app/components/category/category";
import Products from "@/app/components/product/product";
import Collection from "@/app/components/collection/collection";
import Reel from "@/app/components/reel/reel";
import Testimonial from "@/app/components/testimonial/testimonial";
import Spotlight from "@/app/components/spotlight/spotlight";
import Blog from "@/app/components/blog/blog";
import {
    getCategoryList,
    getBestSellers,
    getCollections,
    getReelList,
    getBanners,
    getSpotlights,
    getBlogs,
} from "@/app/lib/api";
import {
    CategoryItem,
    ProductItem,
    CollectionItem,
    ReelItem,
    Banner,
    SpotlightItem,
    BlogItem,
} from "@/app/types/shop.models";
import "./page.css";
import "./skeleton.css";

const MAX_CATEGORY = 12;

const categorySkeletons = Array.from({ length: 6 });
const productSkeletons = Array.from({ length: 4 });
const collectionSkeletons = Array.from({ length: 3 });
const reelSkeletons = Array.from({ length: 4 });
const spotlightSkeletons = Array.from({ length: 2 });
const blogSkeletons = Array.from({ length: 3 });

const STATS = [
    { value: "2 Million+", label: "Happy Customers" },
    { value: "700+", label: "Bottomwear Styles" },
    { value: "60+", label: "Colors & Prints" },
    { value: "450+", label: "Exclusive Stores" },
];

function slugify(name: string) {
    return (name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Best-sellers response gives raw product rows that already match ProductItem
// almost 1:1 — just normalize the badge and make sure color_variants always
// exists as an array.
function mapProduct(row: any): ProductItem {
    const discount = Number(row.discount) || 0;
    return {
        id: row.id,
        name: row.name,
        brand: row.brand,
        unit: row.unit,
        weight: row.weight,
        min_qty: row.min_qty,
        tags: row.tags,
        description: row.description,
        spotlight_image: row.spotlight_image ?? "/assets/images/no-image.png",
        seo_title: row.seo_title,
        seo_description: row.seo_description,
        seo_keywords: row.seo_keywords,
        category_id: row.category_id,
        category: row.category,
        unit_price: row.unit_price,
        discount: row.discount,
        discount_type: row.discount_type,
        discount_start_date: row.discount_start_date,
        discount_end_date: row.discount_end_date,
        effective_price: row.effective_price,
        reward_points: row.reward_points,
        is_flash_sale: row.is_flash_sale,
        flash_sale_title: row.flash_sale_title,
        flash_sale_discount: row.flash_sale_discount,
        flash_sale_discount_type: row.flash_sale_discount_type,
        is_today_sale: row.is_today_sale,
        is_published: row.is_published,
        is_active: row.is_active,
        total_sold: row.total_sold ?? 0,
        is_fallback: row.is_fallback,
        is_wishlisted: row.is_wishlisted,
        created_at: row.created_at,
        updated_at: row.updated_at,
        badge: row.is_flash_sale
            ? row.flash_sale_title || "Sale"
            : discount > 0
            ? `${discount}% OFF`
            : undefined,
        color_variants: row.color_variants || [],
    };
}

function mapCollection(row: any): CollectionItem {
    return {
        id: row.id,
        name: row.name,
        img: row.cover_url || row.banner_url || row.icon_url || "/assets/images/no-image.png",
        slug: slugify(row.name),
    };
}

function buildBannerCategoryUrl(banner: Banner): string {
    const cats = banner.categories || [];
    if (cats.length === 0) return "/all-products";
    const ids = cats.map((c) => c.id).join(",");
    const names = cats.map((c) => c.name).join(",");
    return `/all-products?categoryId=${ids}&categoryName=${encodeURIComponent(names)}`;
}

export default function Home() {
    const router = useRouter();
    const [category, setCategory] = useState<CategoryItem[]>([]);
    const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [collections, setCollections] = useState<CollectionItem[]>([]);
    const [reels, setReels] = useState<ReelItem[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [spotlights, setSpotlights] = useState<SpotlightItem[]>([]);
    const [blogs, setBlogs] = useState<BlogItem[]>([]);

    const [isCategoryLoading, setIsCategoryLoading] = useState(true);
    const [isReelLoading, setIsReelLoading] = useState(true);
    const [isProductLoading, setIsProductLoading] = useState(true);
    const [isCollectionLoading, setIsCollectionLoading] = useState(true);
    const [isBannerLoading, setIsBannerLoading] = useState(true);
    const [isSpotlightLoading, setIsSpotlightLoading] = useState(true);
    const [isBlogLoading, setIsBlogLoading] = useState(true);

    const [categoryError, setCategoryError] = useState(false);
    const [reelError, setReelError] = useState(false);
    const [productError, setProductError] = useState(false);
    const [collectionError, setCollectionError] = useState(false);
    const [bannerError, setBannerError] = useState(false);
    const [spotlightError, setSpotlightError] = useState(false);
    const [blogError, setBlogError] = useState(false);

    const [activeReelIndex, setActiveReelIndex] = useState(0);
    const [activeCategoryId, setActiveCategoryId] = useState<number | "all">("all");

    useEffect(() => {
        // All seven fire together — none blocks another. Each section
        // renders (or shows its own error/empty state) the moment its
        // own call resolves.
        loadBanners();
        loadCategoryList();
        loadReelList();
        loadBestSellers();
        loadCollections();
        loadSpotlights();
        loadBlogs();
    }, []);

    // ---------------- Banners ----------------
    // GET /banners -> { status, data: { data: Banner[], ... (paginated) } }
    async function loadBanners() {
        setIsBannerLoading(true);
        setBannerError(false);
        try {
            const res = await getBanners<any>();
            setBanners(res?.data?.data || []);
        } catch (err) {
            console.error("Error fetching banners:", err);
            setBannerError(true);
        } finally {
            setIsBannerLoading(false);
        }
    }

    function handleBannerClick(banner: Banner) {
        router.push(buildBannerCategoryUrl(banner));
    }

    // ---------------- Best Sellers ----------------
    // GET /admin/home/best-sellers -> { status, message, data: ProductRow[] } (NOT paginated)
    async function loadBestSellers() {
        setIsProductLoading(true);
        setProductError(false);
        try {
            const res = await getBestSellers<any>();
            const rows = res?.data ?? [];
            const mapped = rows.map(mapProduct);
            setAllProducts(mapped);
        } catch (err) {
            console.error("Error fetching best sellers:", err);
            setProductError(true);
        } finally {
            setIsProductLoading(false);
        }
    }

    // ---------------- Collections ----------------
    // GET /admin/home/best-collections -> { status, message, data: CategoryRow[] } (NOT paginated)
    async function loadCollections() {
        setIsCollectionLoading(true);
        setCollectionError(false);
        try {
            const res = await getCollections<any>();
            const rows = res?.data ?? [];
            setCollections(rows.map(mapCollection));
        } catch (err) {
            console.error("Error fetching collections:", err);
            setCollectionError(true);
        } finally {
            setIsCollectionLoading(false);
        }
    }

    // ---------------- Categories ----------------
    // GET /admin/categories -> { status, data: CategoryItem[] } (NOT paginated)
    async function loadCategoryList() {
        setIsCategoryLoading(true);
        setCategoryError(false);
        try {
            const res = await getCategoryList<any>();
            setCategory((res?.data || []).slice(0, MAX_CATEGORY));
        } catch (err) {
            console.error("Error fetching categories:", err);
            setCategoryError(true);
        } finally {
            setIsCategoryLoading(false);
        }
    }

    function selectCategory(id: number | "all") {
        setActiveCategoryId(id);
    }

    // Keep `products` in sync with `allProducts` + `activeCategoryId`
    useEffect(() => {
        setProducts(
            activeCategoryId === "all"
                ? allProducts
                : allProducts.filter((p) => p.category_id === activeCategoryId)
        );
    }, [allProducts, activeCategoryId]);

    // ---------------- Reels ----------------
    // GET /admin/video-reels -> { status, data: { data: ReelItem[], ... (paginated) } }
    async function loadReelList() {
        setIsReelLoading(true);
        setReelError(false);
        try {
            const res = await getReelList<any>();
            const list = (res?.data?.data || []).filter((r: any) => r.is_published !== false);
            setReels(list);
            setActiveReelIndex(0);
        } catch (err) {
            console.error("Error fetching reels:", err);
            setReelError(true);
        } finally {
            setIsReelLoading(false);
        }
    }

    function onReelEnded() {
        if (reels.length === 0) return;
        setActiveReelIndex((i) => (i + 1) % reels.length);
    }

    // ---------------- Spotlight ----------------
    // GET /admin/home/spotlight (assumed) -> { status, data: { data: SpotlightItem[], ... (paginated) } }
    // If your endpoint isn't paginated, this still works via the `res?.data` fallback.
    async function loadSpotlights() {
        setIsSpotlightLoading(true);
        setSpotlightError(false);
        try {
            const res = await getSpotlights<any>();
            setSpotlights(res?.data?.data || res?.data || []);
        } catch (err) {
            console.error("Error fetching spotlight items:", err);
            setSpotlightError(true);
        } finally {
            setIsSpotlightLoading(false);
        }
    }

    // ---------------- Blogs ----------------
    // GET /admin/blogs (assumed) -> { status, data: { data: BlogItem[], ... (paginated) } }
    // If your endpoint isn't paginated, this still works via the `res?.data` fallback.
    async function loadBlogs() {
        setIsBlogLoading(true);
        setBlogError(false);
        try {
            const res = await getBlogs<any>();
            setBlogs(res?.data?.data || res?.data || []);
        } catch (err) {
            console.error("Error fetching blogs:", err);
            setBlogError(true);
        } finally {
            setIsBlogLoading(false);
        }
    }

    // ---------------- Retry handlers ----------------
    const retryBanners = () => loadBanners();
    const retryCategories = () => loadCategoryList();
    const retryProducts = () => loadBestSellers();
    const retryCollections = () => loadCollections();
    const retryReels = () => loadReelList();
    const retrySpotlights = () => loadSpotlights();
    const retryBlogs = () => loadBlogs();

    return (
        <div className="home-page mb-2">
            {/* ===================== BANNER ===================== */}
            {isBannerLoading && (
                <div className="banner-main">
                    <div className="banner-skel skeleton"></div>
                </div>
            )}
            {!isBannerLoading && bannerError && (
                <div className="banner-main">
                    <div className="section-empty">
                        <i className="bx bx-image-alt"></i>
                        <p className="mb-2">Couldn&apos;t load the banner.</p>
                        <button className="retry-btn" onClick={retryBanners}>Retry</button>
                    </div>
                </div>
            )}
            {!isBannerLoading && !bannerError && banners.length > 0 && (
                <div className="banner-main">
                    <div id="homeBannerCarousel" className="carousel slide" data-bs-ride="carousel" data-bs-interval="4000">
                        <div className="carousel-indicators">
                            {banners.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    data-bs-target="#homeBannerCarousel"
                                    data-bs-slide-to={i}
                                    className={i === 0 ? "active" : ""}
                                    aria-current={i === 0 ? "true" : undefined}
                                />
                            ))}
                        </div>
                        <div className="carousel-inner">
                            {banners.map((banner, i) => (
                                <div key={banner.id} className={`carousel-item ${i === 0 ? "active" : ""}`}>
                                    <img
                                        src={banner.mobile_banner_url}
                                        alt={banner.title}
                                        className="d-block d-md-none w-100 banner-clickable"
                                        onClick={() => handleBannerClick(banner)}
                                        role="button"
                                    />
                                    <img
                                        src={banner.web_banner_url}
                                        alt={banner.title}
                                        className="d-none d-md-block w-100 banner-clickable"
                                        onClick={() => handleBannerClick(banner)}
                                        role="button"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {!isBannerLoading && !bannerError && banners.length === 0 && <div className="banner-main"></div>}

            {/* ===================== CATEGORY ===================== */}
            <div className="category-main">
                <div className="category-div">
                    <div className="body-head mb-4">
                        <h4 className="text-center">Shop By Category</h4>
                        <h6 className="text-center">Find your perfect fit form our diverse collection</h6>
                    </div>
                    {isCategoryLoading && (
                        <div className="category-grid">
                            {categorySkeletons.map((_, i) => (
                                <div className="category-box mb-4" key={i}>
                                    <div className="category-skel-img skeleton"></div>
                                    <div className="category-skel-text skeleton"></div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!isCategoryLoading && categoryError && (
                        <div className="section-empty">
                            <i className="bx bx-category-alt"></i>
                            <p className="mb-2">Couldn&apos;t load categories.</p>
                            <button className="retry-btn" onClick={retryCategories}>Retry</button>
                        </div>
                    )}
                    {!isCategoryLoading && !categoryError && category.length === 0 && (
                        <div className="section-empty">
                            <i className="bx bx-category-alt"></i>
                            <p className="mb-0">No categories available right now.</p>
                        </div>
                    )}
                    {!isCategoryLoading && !categoryError && category.length > 0 && (
                        <div className="category-grid">
                            {category.map((item) => (
                                <Category key={item.id} category={item} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ===================== PRODUCT GRID (Best Sellers) ===================== */}
            <div className="product-main">
                <div className="product-div">
                    <div className="body-head mb-4">
                        <h4 className="text-center">Best Sellers</h4>
                    </div>
                    {!isProductLoading && !productError && allProducts.length > 0 && (
                        <ul className="product-tabs nav nav-tabs my-4 border-0" role="tablist">
                            <li className="nav-item mb-2" role="presentation">
                                <button
                                    type="button"
                                    className={`tab-btn ${activeCategoryId === "all" ? "active" : ""}`}
                                    onClick={() => selectCategory("all")}
                                >
                                    All
                                </button>
                            </li>
                            {category.slice(0, 3).map((cat) => (
                                <li className="nav-item mb-2" role="presentation" key={cat.id}>
                                    <button
                                        type="button"
                                        className={`tab-btn ${activeCategoryId === cat.id ? "active" : ""}`}
                                        onClick={() => selectCategory(cat.id)}
                                    >
                                        {cat.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {isProductLoading && (
                        <div className="product-grid">
                            {productSkeletons.map((_, i) => (
                                <div className="product-box" key={i}>
                                    <div className="product-img skeleton"></div>
                                    <div className="product-box-content">
                                        <div className="skel-line skeleton" style={{ width: "45%" }}></div>
                                        <div className="skel-line skeleton" style={{ width: "75%" }}></div>
                                        <div className="skel-line skeleton" style={{ width: "55%" }}></div>
                                        <div className="skel-line skeleton" style={{ width: "40%" }}></div>
                                        <div className="skel-line skeleton" style={{ width: "50%" }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!isProductLoading && productError && (
                        <div className="section-empty">
                            <i className="bx bx-shopping-bag"></i>
                            <p className="mb-2">Couldn&apos;t load products.</p>
                            <button className="retry-btn" onClick={retryProducts}>Retry</button>
                        </div>
                    )}
                    {!isProductLoading && !productError && allProducts.length === 0 && (
                        <div className="section-empty">
                            <i className="fa-solid fa-box-open fa-2x mb-3"></i>
                            <p className="mb-0">No products found.</p>
                        </div>
                    )}
                    {!isProductLoading && !productError && allProducts.length > 0 && products.length === 0 && (
                        <div className="section-empty">
                            <i className="fa-solid fa-box-open fa-2x mb-3"></i>
                            <p className="mb-0">No products found in this category.</p>
                        </div>
                    )}
                    {!isProductLoading && !productError && products.length > 0 && (
                        <div className="product-grid">
                            {products.map((item) => (
                                <Products key={item.id} product={item} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ===================== SPOTLIGHT ===================== */}
            <div className="spotlight-main">
                <div className="spotlight-div">
                    <div className="body-head mb-4">
                        <h4 className="text-center">In The Spotlight</h4>
                        <h6 className="text-center">Handpicked styles we&apos;re loving right now.</h6>
                    </div>
                    {isSpotlightLoading && (
                        <div className="spotlight-grid">
                            {spotlightSkeletons.map((_, i) => (
                                <div className="spotlight-box spotlight-skel skeleton" key={i}></div>
                            ))}
                        </div>
                    )}
                    {!isSpotlightLoading && spotlightError && (
                        <div className="section-empty">
                            <i className="bx bx-star"></i>
                            <p className="mb-2">Couldn&apos;t load the spotlight picks.</p>
                            <button className="retry-btn" onClick={retrySpotlights}>Retry</button>
                        </div>
                    )}
                    {!isSpotlightLoading && !spotlightError && spotlights.length === 0 && (
                        <div className="section-empty">
                            <i className="bx bx-star"></i>
                            <p className="mb-0">No spotlight picks available right now.</p>
                        </div>
                    )}
                    {!isSpotlightLoading && !spotlightError && spotlights.length > 0 && (
                        <div className="spotlight-grid">
                            {spotlights.map((item) => (
                                <Spotlight key={item.id} spotlight={item} />
                            ))}
                        </div>
                    )}

                    {/* ===== STATS CARDS ===== */}
                    <div className="stats-grid">
                        {STATS.map((stat) => (
                            <div className="stats-card" key={stat.label}>
                                <h4 className="stats-value">{stat.value}</h4>
                                <p className="stats-label">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ===================== COLLECTIONS ===================== */}
            <div className="collection-main">
                <div className="collection-div">
                    <div className="body-head mb-4">
                        <h4 className="text-center">Best Collections</h4>
                    </div>
                    {isCollectionLoading && (
                        <div className="collection-grid">
                            {collectionSkeletons.map((_, i) => (
                                <div className="collection-box" key={i}>
                                    <div className="collection-img skeleton"></div>
                                    <div className="collection-box-content">
                                        <div className="collection-skel-pill skeleton"></div>
                                        <div className="collection-skel-circle skeleton"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!isCollectionLoading && collectionError && (
                        <div className="section-empty">
                            <i className="bx bx-collection"></i>
                            <p className="mb-2">Couldn&apos;t load collections.</p>
                            <button className="retry-btn" onClick={retryCollections}>Retry</button>
                        </div>
                    )}
                    {!isCollectionLoading && !collectionError && collections.length === 0 && (
                        <div className="section-empty">
                            <i className="bx bx-collection"></i>
                            <p className="mb-0">No collections available right now.</p>
                        </div>
                    )}
                    {!isCollectionLoading && !collectionError && collections.length > 0 && (
                        <div className="collection-grid">
                            {collections.map((item) => (
                                <Collection key={item.id} collection={item} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ===================== REELS ===================== */}
            <div className="reel-main">
                <div className="reel-div">
                    <div className="body-head mb-4">
                        <h4 className="mb-2 text-center">Reel It, Feel It</h4>
                        <h6 className="text-center">
                            From studio to street — quick looks that make a statement, captured in motion.
                        </h6>
                    </div>
                    {isReelLoading && (
                        <div className="reel-grid">
                            {reelSkeletons.map((_, i) => (
                                <div className="reel-box" key={i}>
                                    <div className="reel-img skeleton"></div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!isReelLoading && reelError && (
                        <div className="section-empty">
                            <i className="bx bx-video"></i>
                            <p className="mb-2">Couldn&apos;t load reels.</p>
                            <button className="retry-btn" onClick={retryReels}>Retry</button>
                        </div>
                    )}
                    {!isReelLoading && !reelError && reels.length === 0 && (
                        <div className="section-empty">
                            <i className="bx bx-video"></i>
                            <p className="mb-0">No reels available right now.</p>
                        </div>
                    )}
                    {!isReelLoading && !reelError && reels.length > 0 && (
                        <div className="reel-grid">
                            {reels.map((item, i) => (
                                <Reel
                                    key={item.id}
                                    reel={item}
                                    isActive={i === activeReelIndex}
                                    onVideoEnded={onReelEnded}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ===================== TESTIMONIAL (static, no API) ===================== */}
            <div className="testimonial-main">
                <div className="testimonial-div">
                    <div className="body-head mb-4">
                        <h4 className="mb-2 text-center">What Our Customers Say</h4>
                        <h6 className="text-center">Real stories, real comfort — hear it from the Flybirds family.</h6>
                    </div>
                    <div className="testimonial-grid">
                        <Testimonial />
                    </div>
                </div>
            </div>

            {/* ===================== BLOGS ===================== */}
            <div className="blog-main">
                <div className="blog-div">
                    <div className="body-head mb-4">
                        <h4 className="text-center">Our Blogs</h4>
                    </div>
                    {isBlogLoading && (
                        <div className="blog-grid">
                            {blogSkeletons.map((_, i) => (
                                <div className="blog-box" key={i}>
                                    <div className="blog-img-skel skeleton"></div>
                                    <div className="blog-box-content">
                                        <div className="skel-line skeleton" style={{ width: "85%" }}></div>
                                        <div className="skel-line skeleton" style={{ width: "60%" }}></div>
                                        <div className="skel-line skeleton" style={{ width: "40%" }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!isBlogLoading && blogError && (
                        <div className="section-empty">
                            <i className="bx bx-news"></i>
                            <p className="mb-2">Couldn&apos;t load blogs.</p>
                            <button className="retry-btn" onClick={retryBlogs}>Retry</button>
                        </div>
                    )}
                    {!isBlogLoading && !blogError && blogs.length === 0 && (
                        <div className="section-empty">
                            <i className="bx bx-news"></i>
                            <p className="mb-0">No blog posts available right now.</p>
                        </div>
                    )}
                    {!isBlogLoading && !blogError && blogs.length > 0 && (
                        <div className="blog-grid">
                            {blogs.map((item) => (
                                <Blog key={item.id} blog={item} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}