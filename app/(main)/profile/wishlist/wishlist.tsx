// app/components/profile/wishlist.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Products from "@/app/components/product/product";
import { getWishlist, removeFromWishlist as removeFromWishlistApi } from "@/app/lib/api";
import { ProductItem } from "@/app/types/shop.models";

import "./wishlist.css";

export default function Wishlist() {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<(ProductItem & { wishlistRowId?: number })[]>([]);

    useEffect(() => {
        loadWishlist();
    }, []);

    async function loadWishlist() {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await getWishlist<any>(userId);
            const rows = res?.data || [];
            setProducts(rows.map(mapToProductItem));
        } catch {
            toast.error("Failed to load wishlist.");
        } finally {
            setLoading(false);
        }
    }

    function mapToProductItem(row: any): ProductItem & { wishlistRowId: number } {
        const product = row.product || row;
        const firstVariant = product.color_variants?.[0];
        const image =
            firstVariant?.thumbnail_image?.image_url ||
            firstVariant?.gallery_images?.[0]?.image_url ||
            "/assets/images/no-image.png";

        return {
            id: product.id,
            wishlistRowId: row.id,
            image,
            badge: product.badge || "",
            title: product.name,
            subtitle: product.brand,
            rating: product.rating || 5,
            review: product.review_count || 0,
            sp: product.effective_price,
            mrp: product.unit_price,
            color_variants: product.color_variants || [],
            category_id: product.category_id,
        };
    }

    async function removeFromWishlist(productId: number) {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        try {
            await removeFromWishlistApi(userId, productId);
            setProducts((prev) => prev.filter((p) => p.id !== productId));
            toast.success("Removed from wishlist!");
        } catch {
            toast.error("Failed to remove from wishlist.");
        }
    }

    return (
        <div>
            <div className="body-head mb-4">
                <h5 className="mb-2 text-main">Wishlist</h5>
                <h6 className="mb-0">Add or remove items from your wishlist.</h6>
            </div>

            {loading && (
                <div className="text-center py-5">
                    <div className="spinner-border text-main"></div>
                    <h6 className="mt-3">Loading Wishlist...</h6>
                </div>
            )}

            {!loading && (
                products.length > 0 ? (
                    <div className="wishlist-product-grid">
                        {products.map((item) => (
                            <div className="product-box-wrapper" key={item.id}>
                                <Products product={item} />
                                <button className="remove-btn" onClick={() => removeFromWishlist(item.id)} title="Remove from Wishlist">
                                    <i className="fas fa-xmark"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted py-5">
                        <i className="fas fa-heart fa-2x mb-3"></i>
                        <p className="mb-0">Your wishlist is empty.</p>
                    </div>
                )
            )}
        </div>
    );
}