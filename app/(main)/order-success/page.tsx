"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getOrderById } from "@/app/lib/api";

import "./page.css";

interface OrderItem {
    name: string;
    color: string;
    size: string;
    qty: number;
    total: number;
    image: string;
}

const PLACEHOLDER = "/assets/images/no-image.png";

function resolveItemImage(item: any): string {
    const variantGallery = item?.product_color_variant?.gallery_images;
    if (Array.isArray(variantGallery) && variantGallery.length > 0) {
        const sorted = [...variantGallery].sort(
            (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        );
        if (sorted[0]?.image_url) return sorted[0].image_url;
    }

    const variantThumb =
        item?.product_color_variant?.thumbnail_image?.image_url;
    if (variantThumb) return variantThumb;

    const detailsGallery = item?.product_details?.color?.gallery_images;
    if (
        Array.isArray(detailsGallery) &&
        detailsGallery.length > 0 &&
        detailsGallery[0]
    ) {
        return detailsGallery[0];
    }

    const productVariants = item?.product?.color_variants;
    if (Array.isArray(productVariants) && item?.product_color_variant_id) {
        const matched = productVariants.find(
            (v: any) => v.id === item.product_color_variant_id,
        );
        const matchedGallery = matched?.gallery_images;
        if (Array.isArray(matchedGallery) && matchedGallery.length > 0) {
            const url = matchedGallery[0]?.image_url || matchedGallery[0];
            if (url) return url;
        }
    }

    return PLACEHOLDER;
}

function formatDate(value: string): string {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function OrderSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");

    const [loading, setLoading] = useState(true);
    const [orderDetails, setOrderDetails] = useState<any>(null);

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }
        getOrderById<any>(orderId)
            .then((res) => setOrderDetails(res?.data ?? null))
            .finally(() => setLoading(false));
    }, [orderId]);

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-main" />
                <h6 className="mt-3">Loading Order...</h6>
            </div>
        );
    }

    if (!orderDetails) {
        return (
            <div className="text-center py-5">
                <h5 className="mb-3">We couldn&apos;t find that order.</h5>
                <Link href="/" className="buy-btn">
                    Continue Shopping
                </Link>
            </div>
        );
    }

    const items: OrderItem[] = (orderDetails?.items || []).map((i: any) => ({
        name: i.product_name ?? "",
        color: i.color ?? "",
        size: i.size ?? "",
        qty: i.quantity ?? 1,
        total: Number(i.total ?? 0),
        image: resolveItemImage(i),
    }));

    const subtotal = Number(orderDetails?.subtotal ?? 0);
    const discountAmount = Number(orderDetails?.discount ?? 0);
    const shippingCharge = Number(orderDetails?.shipping ?? 0);
    const taxAmount = Number(orderDetails?.tax ?? 0);
    const total = Number(orderDetails?.amount ?? 0);
    const orderNumber = orderDetails?.order_id ?? "";
    const orderDate = orderDetails?.created_at ?? "";

    return (
        <div className="success-page-wrap my-4">
            <div className="success-modal-card mx-auto">
                <div className="modal-header-block">
                    <div className="header-left">
                        <img
                            src="/assets/images/Success.png"
                            height={42}
                            className="success-icon"
                            alt="Success"
                        />
                        <div>
                            <h2 className="modal-title">Order Placed!</h2>
                            <p className="modal-subtitle">
                                Thank you for shopping with Flybirds.
                            </p>
                        </div>
                    </div>
                    <img
                        src="/assets/images/Logo-Dark.png"
                        alt="Flybirds"
                        className="modal-brand-logo"
                    />
                </div>

                <hr className="divider" />

                <div className="section two-col">
                    <div className="col">
                        <h3 className="section-title">Order Number</h3>
                        <p className="value-line">{orderNumber}</p>
                    </div>
                    <div className="col">
                        <h3 className="section-title">Order Date</h3>
                        <p className="value-line">{formatDate(orderDate)}</p>
                    </div>
                </div>

                <hr className="divider" />

                <div className="section">
                    <h3 className="section-title">Order Summary</h3>
                    {items.map((item, idx) => (
                        <div className="modal-item-row" key={idx}>
                            <img
                                src={item.image}
                                alt={item.name}
                                className="modal-item-image"
                            />
                            <div className="modal-item-info">
                                <p className="item-name">{item.name}</p>
                                <p className="item-meta">
                                    {item.color} · {item.size} · Qty {item.qty}
                                </p>
                            </div>
                            <p className="item-total">₹{item.total}</p>
                        </div>
                    ))}
                </div>

                <hr className="divider" />

                <div className="totals-block">
                    <div className="totals-row">
                        <span>Subtotal</span>
                        <span>₹{subtotal}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="totals-row">
                            <span>Discount</span>
                            <span>− ₹{discountAmount}</span>
                        </div>
                    )}
                    {shippingCharge > 0 && (
                        <div className="totals-row">
                            <span>Shipping</span>
                            <span>₹{shippingCharge}</span>
                        </div>
                    )}
                    {taxAmount > 0 && (
                        <div className="totals-row">
                            <span>Tax</span>
                            <span>₹{taxAmount}</span>
                        </div>
                    )}
                    <div className="totals-row grand-total">
                        <span>Total</span>
                        <span>₹{total}</span>
                    </div>
                </div>

                <div className="modal-actions">
                    <button
                        className="buy-btn w-50"
                        onClick={() => router.push(`/review?orderId=${orderId}`)}
                    >
                        <i className="fas fa-truck-fast me-1" /> Track Order
                    </button>
                    <Link href="/all-products" className="cart-btn w-50">
                        <i className="fas fa-shopping-bag me-1" /> Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="text-center py-5">
                    <div className="spinner-border text-main" />
                    <h6 className="mt-3">Loading Order...</h6>
                </div>
            }
        >
            <OrderSuccessContent />
        </Suspense>
    );
}