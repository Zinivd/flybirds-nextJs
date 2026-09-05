// app/(main)/product-details/page.tsx
"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import Products from "@/app/components/product/product";
import {
    getProductById,
    getSimilarProducts,
    getReviewsByProduct,
    createReview,
    addToWishlist,
    removeFromWishlist,
    addToCart,
    addRecentlyViewed,
} from "@/app/lib/api";
import { htmlToPlainText, round2, formatDate } from "@/app/lib/format";
import { ProductItem } from "@/app/types/shop.models";
import "./page.css";
import "./content.css";
import "./description.css";
import "./review.css";
// import "./lightbox.css";
interface SizeStock {
    id: number;
    size: string;
    stock: number;
    price: number;
}
interface FamilyColor {
    id: number;
    name: string;
    code: string;
}
interface FamilyColorChild {
    id: number;
    family_color_id: number;
    name: string;
    code: string;
}
interface ColorVariant {
    id: number;
    product_id: number;
    family_color_id: number;
    family_color_child_id: number;
    family_color: FamilyColor;
    family_color_child: FamilyColorChild;
    gallery_images: { image_url: string; sort_order: number }[];
    size_stocks: SizeStock[];
}
interface ProductReview {
    id: number;
    title: string;
    description: string;
    rating: number;
    userName: string;
    createdAt: string;
}
const highlights = [
    { icon: "bx bx-cart", text: "100% Original Products" },
    { icon: "bx bx-handshake", text: "Easy 7 days returns and exchanges" },
    { icon: "bx bx-currency-note", text: "Cash on Delivery" },
];
const fabrics = [
    { text: "Machine Wash", img: "/assets/images/Icons/1.png" },
    { text: "Do Not Tumble Dry", img: "/assets/images/Icons/2.png" },
    { text: "Hand Wash", img: "/assets/images/Icons/3.png" },
    { text: "Do Not Bleach", img: "/assets/images/Icons/4.png" },
    { text: "Use Iron", img: "/assets/images/Icons/5.png" },
    { text: "Wash with like colors", img: "/assets/images/Icons/6.png" },
    { text: "Wash Inside Out", img: "/assets/images/Icons/7.png" },
];
const SLIDES_PER_PAGE = 3;
function getStars(count: number): number[] {
    return Array(Math.round(count)).fill(0);
}
function isWhiteCode(code: string) {
    return ["#fff", "#ffffff", "#fffff"].includes((code || "").toLowerCase());
}
function mapProduct(row: any): ProductItem {
    const firstVariant = row.color_variants?.[0];
    const sortedImages = firstVariant?.gallery_images
        ?.slice()
        .sort((a: any, b: any) => a.sort_order - b.sort_order);
    return {
        id: row.id,
        name: row.name,
        brand: row.brand,
        unit: row.unit,
        weight: row.weight,
        min_qty: row.min_qty,
        tags: row.tags,
        description: row.description,
        spotlight_image: sortedImages?.[0]?.image_url ?? row.spotlight_image ?? "/assets/images/no-image.png",
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
        effective_price: Number(row.effective_price),
        reward_points: row.reward_points,
        is_flash_sale: !!row.is_flash_sale,
        flash_sale_title: row.flash_sale_title,
        flash_sale_discount: row.flash_sale_discount,
        flash_sale_discount_type: row.flash_sale_discount_type,
        is_today_sale: !!row.is_today_sale,
        is_published: !!row.is_published,
        is_active: !!row.is_active,
        total_sold: row.total_sold,
        is_wishlisted: !!row.is_wishlisted,
        created_at: row.created_at,
        updated_at: row.updated_at,
        color_variants: row.color_variants || [],
    };
}
function ProductDetailsInner() {
    const searchParams = useSearchParams();
    const productId = Number(searchParams.get("id"));
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("");
    const [productName, setProductName] = useState("");
    const [productDescription, setProductDescription] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [rating, setRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);
    const [price, setPrice] = useState(0);
    const [originalPrice, setOriginalPrice] = useState(0);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [savedAmount, setSavedAmount] = useState(0);
    const [estimatedDelivery, setEstimatedDelivery] = useState("");
    const [productImages, setProductImages] = useState<string[]>([]);
    const [specifications, setSpecifications] = useState<{ label: string; value: any }[]>([]);
    // Detail Spotlight image
    const [spotlightImage, setSpotlightImage] = useState("");
    // SEO
    const [seoTitle, setSeoTitle] = useState("");
    const [seoDescription, setSeoDescription] = useState("");
    const [seoKeywords, setSeoKeywords] = useState("");
    // Discount info kept from the product response so per-size price can be recalculated
    const [discountRawValue, setDiscountRawValue] = useState(0);
    const [discountRawType, setDiscountRawType] = useState<string | null>(null);
    // Color / shade / size
    const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
    const [familyColors, setFamilyColors] = useState<FamilyColor[]>([]);
    const [selectedFamilyColorId, setSelectedFamilyColorId] = useState<number | null>(null);
    const [shades, setShades] = useState<{ variantId: number; id: number; name: string; code: string }[]>([]);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [availableSizes, setAvailableSizes] = useState<string[]>([]);
    const [selectedSizeStockId, setSelectedSizeStockId] = useState<number | null>(null);
    const [selectedSize, setSelectedSize] = useState("");
    // Reviews
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [isReviewsLoading, setIsReviewsLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewForm, setReviewForm] = useState({ title: "", description: "", rating: 0 });
    const [hoverStar, setHoverStar] = useState(0);
    // Similar products
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [isSimilarLoading, setIsSimilarLoading] = useState(true);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [wishlistBusy, setWishlistBusy] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);
    // Image lightbox / preview
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    function userId() {
        return typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    }
    useEffect(() => {
        if (productId) {
            getProduct();
            loadReviews();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);
    // ---------- SEO meta tags (client-rendered, since data loads after mount) ----------
    useEffect(() => {
        if (loading) return;
        document.title = seoTitle || productName || "Flybirds";
        setMetaTag("description", seoDescription || productDescription);
        setMetaTag("keywords", seoKeywords);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, seoTitle, seoDescription, seoKeywords, productName, productDescription]);
    function setMetaTag(name: string, content: string) {
        if (!content) return;
        let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
        if (!tag) {
            tag = document.createElement("meta");
            tag.setAttribute("name", name);
            document.head.appendChild(tag);
        }
        tag.setAttribute("content", content);
    }
    async function getProduct() {
        setLoading(true);
        try {
            const res = await getProductById<any>(productId);
            const product = res.data;
            setCategory(product.category?.name || "");
            setProductName(product.name);
            setProductDescription(htmlToPlainText(product.description || ""));
            setSubtitle(product.brand);
            setSpotlightImage(product.spotlight_image || "");
            // SEO
            setSeoTitle(product.seo_title || product.name || "");
            setSeoDescription(product.seo_description || "");
            setSeoKeywords(
                Array.isArray(product.seo_keywords) ? product.seo_keywords.join(", ") : product.seo_keywords || ""
            );
            const p = round2(Number(product.effective_price));
            const op = round2(Number(product.unit_price));
            setPrice(p);
            setOriginalPrice(op);
            setDiscountPercent(Number(product.discount) || 0);
            setSavedAmount(round2(op - p));
            // Remember raw discount so per-size prices can be recalculated the same way
            setDiscountRawValue(Number(product.discount) || 0);
            setDiscountRawType(product.discount_type || null);
            setEstimatedDelivery(product.estimate_shipping_days + " Days");
            const variants: ColorVariant[] = product.color_variants || [];
            setColorVariants(variants);
            // Build unique family colors (dedupe by family_color.id, preserve order)
            const familyMap = new Map<number, FamilyColor>();
            variants.forEach((v) => {
                if (v.family_color && !familyMap.has(v.family_color.id)) {
                    familyMap.set(v.family_color.id, v.family_color);
                }
            });
            const familyList = Array.from(familyMap.values());
            setFamilyColors(familyList);
            if (variants.length) {
                const firstVariant = variants[0];
                applyFamilyColor(firstVariant.family_color_id, variants, firstVariant.id);
            } else {
                setProductImages(["/assets/images/no-image.png"]);
            }
            setSpecifications([
                { label: "Brand", value: product.brand },
                { label: "Category", value: product.category?.name },
                { label: "Unit", value: product.unit },
                { label: "Weight", value: product.weight },
                { label: "Minimum Quantity", value: product.min_qty },
                { label: "Reward Points", value: product.reward_points },
                { label: "Tags", value: product.tags },
                { label: "Shipping Days", value: product.estimate_shipping_days + " Days" },
            ]);
            setIsWishlisted(!!product.is_wishlisted);
            setLoading(false);
            trackRecentlyViewed();
            loadSimilarProducts();
        } catch {
            setLoading(false);
        }
    }
    async function loadSimilarProducts() {
        setIsSimilarLoading(true);
        try {
            const res = await getSimilarProducts<any>(productId);
            const rows = res?.data?.data ?? res?.data ?? [];
            setProducts(rows.map(mapProduct));
        } catch (err) {
            console.error("Error fetching similar products:", err);
        } finally {
            setIsSimilarLoading(false);
        }
    }
    // ---------- Reviews ----------
    async function loadReviews() {
        setIsReviewsLoading(true);
        try {
            const res = await getReviewsByProduct<any>(productId);
            const data = res?.data ?? res;
            const rows = data?.reviews?.data ?? [];
            setReviews(
                rows.map((r: any) => ({
                    id: r.id,
                    title: r.title ?? "",
                    description: r.description ?? "",
                    rating: Number(r.rating ?? 0),
                    userName: r.user?.name ?? "Customer",
                    createdAt: r.created_at ?? "",
                }))
            );
            setRating(Number(data?.rating_summary?.average_rating ?? 0));
            setReviewCount(Number(data?.rating_summary?.total_reviews ?? 0));
            setCurrentSlide(0);
        } catch {
            // silent
        } finally {
            setIsReviewsLoading(false);
        }
    }
    function openReviewModal() {
        if (!userId()) {
            toast.info("Please log in to write a review.");
            return;
        }
        setReviewForm({ title: "", description: "", rating: 0 });
        setShowReviewModal(true);
    }
    function closeReviewModal() {
        setShowReviewModal(false);
    }
    function setReviewRating(star: number) {
        setReviewForm((f) => ({ ...f, rating: star }));
    }
    async function submitReview() {
        const uid = userId();
        if (!uid) return;
        if (!reviewForm.title.trim()) {
            toast.error("Please enter a title.");
            return;
        }
        if (!reviewForm.description.trim()) {
            toast.error("Please enter a description.");
            return;
        }
        if (reviewForm.rating < 1) {
            toast.error("Please select a star rating.");
            return;
        }
        if (submittingReview) return;
        setSubmittingReview(true);
        try {
            await createReview<any>({
                user_id: uid,
                product_id: productId,
                title: reviewForm.title.trim(),
                description: reviewForm.description.trim(),
                rating: reviewForm.rating,
            });
            toast.success("Review submitted!");
            setShowReviewModal(false);
            loadReviews();
        } catch {
            toast.error("Failed to submit review.");
        } finally {
            setSubmittingReview(false);
        }
    }
    const visibleReviews = reviews.slice(currentSlide, currentSlide + SLIDES_PER_PAGE);
    function prevSlide() {
        if (currentSlide > 0) setCurrentSlide((s) => s - 1);
    }
    function nextSlide() {
        if (currentSlide + SLIDES_PER_PAGE < reviews.length) setCurrentSlide((s) => s + 1);
    }
    // ---------- Family Color / Shade / Size ----------
    function applyFamilyColor(familyColorId: number, variants: ColorVariant[], preferredVariantId?: number) {
        setSelectedFamilyColorId(familyColorId);
        const familyVariants = variants.filter((v) => v.family_color_id === familyColorId);
        const shadeList = familyVariants.map((v) => ({
            variantId: v.id,
            id: v.family_color_child.id,
            name: v.family_color_child.name,
            code: v.family_color_child.code,
        }));
        setShades(shadeList);
        const variantToSelect =
            familyVariants.find((v) => v.id === preferredVariantId) || familyVariants[0];
        if (variantToSelect) applyVariant(variantToSelect);
    }
    function selectFamilyColor(familyColorId: number) {
        if (familyColorId === selectedFamilyColorId) return;
        applyFamilyColor(familyColorId, colorVariants);
    }
    function selectShade(variantId: number) {
        const variant = colorVariants.find((v) => v.id === variantId);
        if (variant) applyVariant(variant);
    }
    function applyVariant(variant: ColorVariant) {
        setSelectedVariantId(variant.id);
        const images = (variant.gallery_images || [])
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((img) => img.image_url);
        setProductImages(images.length ? images : ["/assets/images/no-image.png"]);
        setAvailableSizes((variant.size_stocks || []).map((s) => s.size));
        setSelectedSize("");
        setSelectedSizeStockId(null);
    }
    // Recompute the effective price / original price / discount % / saved amount
    // for a given base price, using the same discount rule as the product.
    function computePricingForBase(basePrice: number) {
        const base = round2(Number(basePrice));
        let effective = base;
        let percent = 0;
        if (discountRawType === "percent" && discountRawValue > 0) {
            percent = discountRawValue;
            effective = round2(base - (base * discountRawValue) / 100);
        } else if (discountRawType === "flat" && discountRawValue > 0) {
            effective = round2(base - discountRawValue);
            percent = base > 0 ? round2((discountRawValue / base) * 100) : 0;
        }
        return {
            effective,
            original: base,
            percent,
            saved: round2(base - effective),
        };
    }
    function selectSize(size: string) {
        setSelectedSize(size);
        const variant = colorVariants.find((v) => v.id === selectedVariantId);
        const stock = variant?.size_stocks.find((s) => s.size === size);
        setSelectedSizeStockId(stock ? stock.id : null);
        if (stock) {
            const { effective, original, percent, saved } = computePricingForBase(Number(stock.price));
            setPrice(effective);
            setOriginalPrice(original);
            setDiscountPercent(percent);
            setSavedAmount(saved);
        }
    }
    // ---------- Wishlist / cart ----------
    async function toggleWishlist() {
        const uid = userId();
        if (!uid) {
            toast.info("Please log in to use your wishlist.");
            return;
        }
        if (wishlistBusy) return;
        setWishlistBusy(true);
        try {
            if (isWishlisted) {
                await removeFromWishlist(uid, productId);
                setIsWishlisted(false);
                toast.success("Removed from wishlist!");
            } else {
                await addToWishlist(uid, { product_id: productId });
                setIsWishlisted(true);
                toast.success("Added to wishlist!");
            }
        } catch {
            toast.error(isWishlisted ? "Failed to remove from wishlist." : "Failed to add to wishlist.");
        } finally {
            setWishlistBusy(false);
        }
    }
    async function addToBag() {
        const uid = userId();
        if (!uid) {
            toast.info("Please log in to add items to your bag.");
            return;
        }
        if (!selectedVariantId) {
            toast.info("Please select a color.");
            return;
        }
        if (!selectedSizeStockId) {
            toast.info("Please select a size.");
            return;
        }
        if (addingToCart) return;
        const variant = colorVariants.find((v) => v.id === selectedVariantId);
        if (!variant) {
            toast.error("Selected color variant not found.");
            return;
        }
        setAddingToCart(true);
        try {
            await addToCart(uid, {
                product_id: productId,
                product_color_variant_id: selectedVariantId,
                family_color_id: variant.family_color_id,
                family_color_child_id: variant.family_color_child_id ?? null,
                product_size_stock_id: selectedSizeStockId,
                quantity: 1,
            });
            toast.success("Added to bag!");
        } catch {
            toast.error("Failed to add to bag.");
        } finally {
            setAddingToCart(false);
        }
    }
    function buyNow() {
        addToBag();
    }
    async function trackRecentlyViewed() {
        const uid = userId();
        if (!uid) return;
        try {
            await addRecentlyViewed({ user_id: uid, product_id: productId });
        } catch (err: any) {
            console.error("Failed to record recently viewed:", err?.response?.data || err);
        }
    }
    // ---------- Image Lightbox ----------
    function openLightbox(index: number) {
        setLightboxIndex(index);
        setLightboxOpen(true);
    }
    function closeLightbox() {
        setLightboxOpen(false);
    }
    function prevLightboxImage() {
        setLightboxIndex((i) => (i - 1 + productImages.length) % productImages.length);
    }
    function nextLightboxImage() {
        setLightboxIndex((i) => (i + 1) % productImages.length);
    }
    useEffect(() => {
        if (!lightboxOpen) return;
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowLeft") prevLightboxImage();
            if (e.key === "ArrowRight") nextLightboxImage();
        }
        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lightboxOpen, productImages.length]);
    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-main"></div>
                <h6 className="mt-3">Loading product...</h6>
            </div>
        );
    }
    return (
        <div className="product-details my-4">
            {/* Breadcrumb */}
            <div className="body-head mb-3">
                <h6 className="d-flex align-items-center column-gap-2 mb-0">
                    <Link href="/">
                        Home <i className="fas fa-chevron-right ps-1"></i>
                    </Link>
                    <a className="active">{category}</a>
                </h6>
            </div>
            {/* Product Content */}
            <div className="product-details-main">
                <div className="product-content">
                    <div className="product-content-left">
                        {productImages.map((img, i) => (
                            <div
                                className="product-content-img"
                                key={i}
                                onClick={() => openLightbox(i)}
                                role="button"
                                tabIndex={0}
                            >
                                <img src={img} alt="" />
                            </div>
                        ))}
                    </div>
                    <div className="product-content-right">
                        <h4 className="mb-1 text-main">{category}</h4>
                        <div className="d-flex align-items-center justify-content-between flex-wrap">
                            <h2 className="mb-2">{productName}</h2>
                            <div className="d-flex align-items-center column-gap-2 flex-wrap">
                                <button className="nav-icon-btn mb-2">
                                    <i className="bx bx-share"></i>
                                </button>
                                <button
                                    className={`nav-icon-btn mb-2 ${isWishlisted ? "active" : ""}`}
                                    onClick={toggleWishlist}
                                >
                                    <i className={`bx ${isWishlisted ? "bxs-heart text-main" : "bx-heart"}`}></i>
                                </button>
                            </div>
                        </div>
                        <h4 className="mb-3">{subtitle}</h4>
                        <h6 className="mb-3">
                            <i className="fas fa-star text-warning"></i> {rating.toFixed(1)} ({reviewCount} Reviews)
                        </h6>
                        <div className="d-flex align-items-center column-gap-2 flex-wrap">
                            <h3 className="mb-2">
                                &#8377; {price}
                                {discountPercent > 0 && (
                                    <span className="ms-2 text-decoration-line-through">&#8377; {originalPrice}</span>
                                )}
                            </h3>
                            {discountPercent > 0 && (
                                <h5 className="mb-2 text-success">
                                    ({discountPercent}% OFF | You&apos;ll save Rs {savedAmount})
                                </h5>
                            )}
                        </div>
                        <h6 className="mb-2">(Inclusive of all taxes)</h6>
                        <hr />
                        {/* Select Family Color */}
                        <div className="d-flex justify-content-between align-items-center flex-wrap">
                            <h5 className="mb-3">Select Family Color</h5>
                        </div>
                        <div className="colors-div mb-3">
                            {familyColors.map((item) => (
                                <div
                                    className={`color-swatch ${item.id === selectedFamilyColorId ? "active" : ""}`}
                                    key={item.id}
                                    onClick={() => selectFamilyColor(item.id)}
                                >
                                    <span
                                        className="color-box"
                                        style={{
                                            backgroundColor: item.code,
                                            border: isWhiteCode(item.code) ? "1px solid var(--border)" : "none",
                                        }}
                                    ></span>
                                    <small className="mt-2">{item.name}</small>
                                </div>
                            ))}
                        </div>
                        {/* Select Shade */}
                        {shades.length > 0 && (
                            <>
                                <div className="d-flex justify-content-between align-items-center flex-wrap">
                                    <h5 className="mb-3">Select Shade</h5>
                                </div>
                                <div className="shades-div mb-3">
                                    {shades.map((item) => (
                                        <div
                                            className={`shade-swatch ${item.variantId === selectedVariantId ? "active" : ""}`}
                                            key={item.variantId}
                                            onClick={() => selectShade(item.variantId)}
                                        >
                                            <span
                                                className="shade-box"
                                                style={{
                                                    backgroundColor: item.code,
                                                    border: isWhiteCode(item.code) ? "1px solid var(--border)" : "none",
                                                }}
                                            ></span>
                                            <small className="mt-2">{item.name}</small>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        <hr />
                        {/* Sizes */}
                        <div className="d-flex justify-content-between align-items-center flex-wrap">
                            <h5 className="mb-2">Select Size</h5>
                        </div>
                        <div className="sizes-div mb-3">
                            {availableSizes.map((size) => (
                                <button
                                    className={`size-btn w-auto ${selectedSize === size ? "active" : ""}`}
                                    key={size}
                                    onClick={() => selectSize(size)}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                        <hr />
                        {/* Buttons */}
                        <div className="d-flex align-items-center column-gap-1">
                            <button className="cart-btn1 w-100" onClick={buyNow}>
                                Buy Now
                            </button>
                            <button className="cart-btn w-100 active" onClick={addToBag} disabled={addingToCart}>
                                <i className="bx bx-shopping-bag"></i> {addingToCart ? "Adding..." : "Add to Bag"}
                            </button>
                        </div>
                        <hr />
                        {/* Highlights */}
                        {highlights.map((item, i) => (
                            <div className="d-flex align-items-center column-gap-3 mb-3" key={i}>
                                <div className="nav-icon-btn rounded-2">
                                    <i className={item.icon}></i>
                                </div>
                                <h5 className="mb-0 text-secondary">{item.text}</h5>
                            </div>
                        ))}
                        <h6 className="mt-4">
                            (*Please note The item must be unused, unwashed, and in its original
                            condition with all tags and packaging Fly Birds.)
                        </h6>
                    </div>
                </div>
            </div>
            <hr />
            {/* PRODUCT DESCRIPTION */}
            <div className="product-description-main">
                <div className="product-description-left">
                    {spotlightImage ? (
                        <img src={spotlightImage} alt="Detail Spotlight" className="spotlight-img" />
                    ) : (
                        <div className="body-head mb-0">
                            <h4 className="mb-0">Detail Spotlight</h4>
                        </div>
                    )}
                </div>
                <div className="product-description-right form">
                    <h5 className="mb-2 text-main">Product Description</h5>
                    <h6 className="mb-0 description-text" style={{ whiteSpace: "pre-line" }}>
                        {productDescription}
                    </h6>
                    <hr />
                    <h5 className="mb-2 text-main">Specifications</h5>
                    <div className="row">
                        {specifications.map((spec, i) => (
                            <div className="col-md-6 col-lg-4 mb-3" key={i}>
                                <label>{spec.label}</label>
                                <h6 className="mb-0">{spec.value}</h6>
                            </div>
                        ))}
                    </div>
                    <hr />
                    <h5 className="mb-2 text-main">Fabric &amp; Care</h5>
                    <div className="fabric-grid">
                        {fabrics.map((item, i) => (
                            <div className="fabric-div mb-2" key={i}>
                                <div className="fabric-img">
                                    <img src={item.img} alt={item.text} />
                                </div>
                                <h6 className="mb-0 text-center">{item.text}</h6>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* REVIEWS */}
            <div className="product-review-main">
                <div className="product-review-div">
                    <div className="body-head mb-3">
                        <h4 className="text-center">Customer Reviews</h4>
                    </div>
                    <div className="review-main">
                        <div className="review-header">
                            <div className="review-header-left">
                                <div className="review-i-tag">
                                    {getStars(rating).map((_, i) => (
                                        <i className="fas fa-star" key={i}></i>
                                    ))}
                                </div>
                                <h6>
                                    {reviewCount > 0
                                        ? `${rating.toFixed(1)} out of 5 (${reviewCount} reviews)`
                                        : "Be the first to write a review"}
                                </h6>
                            </div>
                            <div className="review-header-border"></div>
                            <div className="review-header-right">
                                <button className="form-btn" onClick={openReviewModal}>
                                    Write a Review
                                </button>
                            </div>
                        </div>
                        {!isReviewsLoading && reviews.length > 0 && (
                            <div className="review-slider">
                                <button className="slider-arrow left" onClick={prevSlide} disabled={currentSlide === 0}>
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <div className="review-slider-track">
                                    {visibleReviews.map((item) => (
                                        <div className="review-swiper-item" key={item.id}>
                                            <h4 className="mb-2">{item.title}</h4>
                                            <h5 className="mb-3">{item.description}</h5>
                                            <div className="d-flex align-items-center justify-content-center column-gap-3 mb-3">
                                                <i className="far fa-user"></i>
                                                <h5 className="mb-0">{item.userName}</h5>
                                            </div>
                                            <div className="d-flex align-items-center justify-content-center mb-2">
                                                {getStars(item.rating).map((_, i) => (
                                                    <i className="fas fa-star" style={{ color: "#F8B700" }} key={i}></i>
                                                ))}
                                            </div>
                                            <h6>{formatDate(item.createdAt)}</h6>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    className="slider-arrow right"
                                    onClick={nextSlide}
                                    disabled={currentSlide + SLIDES_PER_PAGE >= reviews.length}
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                        {!isReviewsLoading && reviews.length === 0 && (
                            <div className="text-center text-muted py-4">
                                <i className="fas fa-star fa-2x mb-3"></i>
                                <p>No reviews yet. Be the first to share your thoughts!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Write a Review Modal */}
            {showReviewModal && (
                <div className="custom-modal-overlay" onClick={closeReviewModal}>
                    <div className="custom-modal-box form" onClick={(e) => e.stopPropagation()}>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h5 className="mb-0 text-main">Write a Review</h5>
                            <button type="button" className="nav-icon-btn" onClick={closeReviewModal}>
                                <i className="fas fa-xmark"></i>
                            </button>
                        </div>
                        <div className="mb-3">
                            <label className="mb-2">
                                Your Rating <span>*</span>
                            </label>
                            <div className="d-flex column-gap-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <i
                                        className="fas fa-star"
                                        key={s}
                                        style={{
                                            cursor: "pointer",
                                            fontSize: "22px",
                                            color: (hoverStar || reviewForm.rating) >= s ? "#F8B700" : "#ccc",
                                        }}
                                        onMouseEnter={() => setHoverStar(s)}
                                        onMouseLeave={() => setHoverStar(0)}
                                        onClick={() => setReviewRating(s)}
                                    ></i>
                                ))}
                            </div>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="review-title">
                                Title <span>*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="review-title"
                                placeholder="Summarize your experience"
                                value={reviewForm.title}
                                onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="review-description">
                                Description <span>*</span>
                            </label>
                            <textarea
                                className="form-control"
                                id="review-description"
                                rows={4}
                                placeholder="Tell others what you liked or didn't like"
                                value={reviewForm.description}
                                onChange={(e) => setReviewForm((f) => ({ ...f, description: e.target.value }))}
                            ></textarea>
                        </div>
                        <button type="button" className="login-btn w-100" disabled={submittingReview} onClick={submitReview}>
                            {submittingReview ? "Submitting..." : "Submit Review"}
                        </button>
                    </div>
                </div>
            )}
            {/* SIMILAR PRODUCTS */}
            <div className="product-main mt-4">
                {isSimilarLoading && (
                    <div className="text-center py-5">
                        <div className="spinner-border text-main"></div>
                        <h6 className="mt-3">Loading Similar Products...</h6>
                    </div>
                )}
                {!isSimilarLoading && products.length > 0 && (
                    <div className="product-div w-100">
                        <div className="body-head mb-3">
                            <h4 className="text-center">Similar Products</h4>
                        </div>
                        <div className="product-grid">
                            {products.map((item) => (
                                <Products key={item.id} product={item} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {/* IMAGE LIGHTBOX / PREVIEW */}
            {lightboxOpen && productImages.length > 0 && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <div className="lightbox-header" onClick={(e) => e.stopPropagation()}>
                        <div className="lightbox-header-info">
                            <span className="lightbox-title">{productName}</span>
                        </div>
                        <div className="lightbox-header-actions">
                            <span className="lightbox-counter">
                                {lightboxIndex + 1} of {productImages.length}
                            </span>
                            <button className="lightbox-close-btn" onClick={closeLightbox} aria-label="Close preview">
                                <i className="fas fa-xmark"></i>
                            </button>
                        </div>
                    </div>
                    <div className="lightbox-body" onClick={(e) => e.stopPropagation()}>
                        {productImages.length > 1 && (
                            <button
                                className="lightbox-arrow lightbox-arrow-left"
                                onClick={prevLightboxImage}
                                aria-label="Previous image"
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>
                        )}
                        <div className="lightbox-image-wrapper">
                            <img
                                src={productImages[lightboxIndex]}
                                alt={`${productName} ${lightboxIndex + 1}`}
                                className="lightbox-image"
                            />
                        </div>
                        {productImages.length > 1 && (
                            <button
                                className="lightbox-arrow lightbox-arrow-right"
                                onClick={nextLightboxImage}
                                aria-label="Next image"
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        )}
                    </div>
                    {productImages.length > 1 && (
                        <div className="lightbox-thumbnails" onClick={(e) => e.stopPropagation()}>
                            {productImages.map((img, i) => (
                                <div
                                    key={i}
                                    className={`lightbox-thumb ${i === lightboxIndex ? "active" : ""}`}
                                    onClick={() => setLightboxIndex(i)}
                                >
                                    <img src={img} alt="" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
export default function ProductDetails() {
    return (
        <Suspense
            fallback={
                <div className="text-center py-5">
                    <div className="spinner-border text-main"></div>
                    <h6 className="mt-3">Loading product...</h6>
                </div>
            }
        >
            <ProductDetailsInner />
        </Suspense>
    );
}