"use client";
import { useState } from "react";
import Link from "next/link";
import { ProductItem } from "@/app/types/shop.models";
import { addToCart as addToCartApi } from "@/app/lib/api";
import { toast } from "react-toastify";
import "./product.css";

const DEFAULT_SWATCH_PALETTE = ["#5B5B5B", "#D8D3E0", "#9D8FC2", "#F2A83B", "#E0B0FF", "#8FA8C9"];

export default function Products({ product }: { product: ProductItem }) {
    const [addingToCart, setAddingToCart] = useState(false);

    async function handleAddToCart(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        const userId = localStorage.getItem("userId");
        if (!userId) {
            toast.info("Please log in to add items to your bag.");
            return;
        }
        if (addingToCart) return;

        const firstVariant = product.color_variants?.[0];
        if (!firstVariant) {
            toast.info("This product isn't available to add right now.");
            return;
        }

        const firstSizeStock = firstVariant.size_stocks?.[0];
        if (!firstSizeStock) {
            // No sizes at all for this variant — send the user to pick manually
            toast.info("Please select options for this product.");
            return;
        }

        setAddingToCart(true);
        try {
            await addToCartApi(userId, {
                product_id: product.id,
                product_color_variant_id: firstVariant.id,
                family_color_id: firstVariant.family_color_id,
                family_color_child_id: firstVariant.family_color_child_id ?? null,
                product_size_stock_id: firstSizeStock.id,
                quantity: 1,
            });
            toast.success("Added to bag!");
        } catch {
            toast.error("Failed to add to bag.");
        } finally {
            setAddingToCart(false);
        }
    }

    const colorVariants = product.color_variants || [];
    const visibleSwatches = colorVariants.slice(0, 4);

    // Prefer the first color variant's thumbnail/gallery image;
    // fall back to spotlight_image, then a placeholder.
    const firstVariant = colorVariants[0];
    const mainImage =
        firstVariant?.thumbnail_image?.image_url ||
        firstVariant?.gallery_images?.[0]?.image_url ||
        product.spotlight_image ||
        "/assets/images/no-image.png";

    const mrp = Number(product.unit_price) || 0;
    const sp = Number(product.effective_price) || mrp;
    const savings = Math.max(mrp - sp, 0);

    const subtitle = product.tags
        ? product.tags
            .split(",")
            .slice(0, 2)
            .map((t) => t.trim())
            .join(" | ")
        : product.brand || "";

    return (
        <div className="product-box" id={String(product.id)}>
            <div className="product-img">
                <img src={mainImage} alt={product.name} />
                {product.badge && <span className="product-badge">{product.badge}</span>}
                <div className="product-cart-btn">
                    <button className="add-cart-btn" onClick={handleAddToCart} disabled={addingToCart}>
                        <i className="bx bx-shopping-bag"></i> Add to Bag
                    </button>
                </div>
            </div>
            <Link href={`/product-details?id=${product.id}`}>
                <div className="product-box-content">
                    <h4 className="mb-0">
                        <i className="fas fa-star"></i> {product.rating ?? 4.7} ({product.review ?? 202} Reviews)
                    </h4>
                    <h3 className="mb-0">{product.name}</h3>
                    {subtitle && <h6 className="mb-0">{subtitle}</h6>}
                    {colorVariants.length > 0 && (
                        <div className="product-colors-main d-flex align-items-center justify-content-center column-gap-2 mb-0">
                            <div className="product-colors-div">
                                {visibleSwatches.map((variant, i) => {
                                    const swatch =
                                        variant.family_color_child?.code ||
                                        variant.family_color?.code ||
                                        variant.color?.code ||
                                        DEFAULT_SWATCH_PALETTE[i % DEFAULT_SWATCH_PALETTE.length];
                                    const label =
                                        variant.family_color_child?.name ||
                                        variant.family_color?.name ||
                                        variant.color?.name ||
                                        "";
                                    return (
                                        <div
                                            key={variant.id ?? i}
                                            className="colors-round"
                                            style={{
                                                backgroundColor: swatch,
                                                marginLeft: i === 0 ? 0 : -8,
                                            }}
                                            title={label}
                                        />
                                    );
                                })}
                            </div>
                            <span>
                                {colorVariants.length}
                                {colorVariants.length >= 5 ? "+" : ""} {colorVariants.length === 1 ? "Color" : "Colors"}
                            </span>
                        </div>
                    )}
                    <h5 className="mb-0">
                        Rs {sp} <span className="ms-1">Rs {mrp}</span>
                    </h5>
                    {savings > 0 && <p className="mb-0">You&apos;ll save Rs {savings}</p>}
                    <button className="add-cart-btn-2 w-100" onClick={handleAddToCart} disabled={addingToCart}>
                        {addingToCart ? "Adding..." : "Add to Bag"}
                    </button>
                </div>
            </Link>
        </div>
    );
}