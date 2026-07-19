// app/components/products/products.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductItem } from "@/app/types/shop.models";
import { addToCart as addToCartApi } from "@/app/lib/api";
import { toast } from "react-toastify";

import "./product.css"

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

        setAddingToCart(true);
        try {
            await addToCartApi(userId, { product_id: product.id, quantity: 1 });
            toast.success("Added to bag!");
        } catch {
            toast.error("Failed to add to bag.");
        } finally {
            setAddingToCart(false);
        }
    }

    const colorVariants = product.color_variants || [];

    return (
        <div className="product-box" id={String(product.id)}>
            <div className="product-img">
                <img src={product.image} alt={product.title} />
                <span className="product-badge">{product.badge}</span>
                <div className="product-cart-btn">
                    <button className="add-cart-btn" onClick={handleAddToCart}>
                        <i className="bx bx-shopping-bag"></i> Add to Bag
                    </button>
                </div>
            </div>
            <Link href={`/product-details/${product.id}`}>
                <div className="product-box-content">
                    <h4 className="mb-0">
                        <i className="fas fa-star text-warning"></i> {product.rating} ({product.review} Reviews)
                    </h4>
                    <h3 className="mb-0">{product.title}</h3>
                    <h6 className="mb-0">{product.subtitle}</h6>
                    <div className="product-colors-main d-flex align-items-center justify-content-center column-gap-2 mb-0">
                        <div className="product-colors-div">
                            {colorVariants.map((variant, i) => (
                                <div
                                    key={i}
                                    className="colors-round"
                                    style={{ backgroundColor: variant.color.code, marginLeft: i === 0 ? 0 : -8 }}
                                />
                            ))}
                        </div>
                        <span>
                            {colorVariants.length} {colorVariants.length === 1 ? "Color" : "Colors"}
                        </span>
                    </div>
                    <h5 className="mb-0">
                        Rs {product.sp} <span className="ms-1">Rs {product.mrp}</span>
                    </h5>
                    <p className="mb-0">You'll save Rs 21</p>
                    <button className="add-cart-btn-2 w-100" onClick={handleAddToCart}>Add to Bag</button>
                </div>
            </Link>
        </div>
    );
}