"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getOrderById, sentMail } from "@/app/lib/api";

import "./page.css";

interface OrderItem {
    name: string;
    color: string;
    size: string;
    qty: number;
    price: number;
    total: number;
    image: string;
}

const PLACEHOLDER = "/assets/images/no-image.png";

// ═══════════════════════════════════════════════════════════════
// Pulls the correct product image for each order line item.
// Priority matches the ACTUAL API payload shape (see original
// Angular review.component.ts for the full rationale):
// 1. product_color_variant.gallery_images[] (objects, has sort_order)
// 2. product_color_variant.thumbnail_image.image_url
// 3. product_details.color.gallery_images[] (plain string urls)
// 4. product.color_variants[] matched by product_color_variant_id
// 5. placeholder image
// ═══════════════════════════════════════════════════════════════
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

function ReviewPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status") as "success" | "failed" | null;

    const [loading, setLoading] = useState(true);
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const mailSent = useRef(false);

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        getOrderById<any>(orderId)
            .then((res) => setOrderDetails(res?.data ?? null))
            .finally(() => setLoading(false));
    }, [orderId]);

    // On a successful payment, hand off to the dedicated order-success
    // page (fires the invoice email once, then redirects).
    useEffect(() => {
        if (status === "success" && orderDetails && orderId) {
            if (!mailSent.current) {
                mailSent.current = true;
                sentMail<any>(orderId).catch(() => { });
            }
            router.replace(`/order-success?orderId=${orderId}`);
        }
    }, [status, orderDetails, orderId, router]);

    function onImgError(e: React.SyntheticEvent<HTMLImageElement>) {
        e.currentTarget.src = PLACEHOLDER;
    }

    const items: OrderItem[] = (orderDetails?.items || []).map((i: any) => ({
        name: i.product_name ?? "",
        color: i.color ?? "",
        size: i.size ?? "",
        qty: i.quantity ?? 1,
        price: Number(i.price ?? 0),
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
    const shippingAddress = orderDetails?.shipping_address ?? "";
    const customerName = orderDetails?.customer_name ?? "";
    const customerPhone = orderDetails?.customer_phone ?? "";
    const paymentStatus = orderDetails?.payment_status ?? "";

    if (loading || (status === "success" && orderDetails)) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-main" />
                <h6 className="mt-3">Loading Order...</h6>
            </div>
        );
    }

    return (
        <div className="review my-4">
            <div className="stepper mb-4">
                <div className="step done">
                    <div className="step-circle">1</div>
                    <span className="step-label">Address</span>
                </div>
                <div className="connector" />
                <div className="step done">
                    <div className="step-circle">2</div>
                    <span className="step-label">Payment</span>
                </div>
                <div className="connector" />
                <div className="step active">
                    <div className="step-circle">3</div>
                    <span className="step-label">Review</span>
                </div>
            </div>

            <div className="review-div">
                {status === "failed" && (
                    <div className="body-head text-center d-block mx-auto mb-4">
                        <i
                            className="fa-solid fa-circle-xmark text-danger mb-2"
                            style={{ fontSize: 50 }}
                        />
                        <h4 className="mb-2 text-danger">Payment Failed</h4>
                        <h6 className="mb-0">
                            Something went wrong while processing your payment. Please try
                            again.
                        </h6>
                    </div>
                )}

                {orderDetails && (
                    <div className="review-card form mb-3">
                        <div className="body-head mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <h5 className="mb-0 text-main">Order Details</h5>
                            <span
                                className={`badge ${paymentStatus === "Pending" ? "badge-secondary" : ""
                                    }`}
                            >
                                Payment: {paymentStatus}
                            </span>
                        </div>
                        <div className="row row-gap-3">
                            <div className="col-md-4">
                                <label>Order ID</label>
                                <h5 className="mb-0">{orderNumber}</h5>
                            </div>
                            {orderDate && (
                                <div className="col-md-4">
                                    <label>Order Date</label>
                                    <h5 className="mb-0">
                                        {new Date(orderDate).toLocaleDateString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </h5>
                                </div>
                            )}
                        </div>
                        <div className="divider-line my-4" />
                        <div className="body-head mb-4">
                            <h5 className="mb-0">Order Summary</h5>
                        </div>
                        <div className="summary-list">
                            {items.map((item, idx) => (
                                <div className="summary-item" key={idx}>
                                    <div className="product-cell">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            onError={onImgError}
                                        />
                                        <div>
                                            <h5 className="mb-1">{item.name}</h5>
                                            <h6 className="mb-1">x {item.qty}</h6>
                                            <h6 className="mb-1 text-muted">{item.color}</h6>
                                            <h6 className="mb-1 text-muted">{item.size}</h6>
                                        </div>
                                    </div>
                                    <h5 className="mb-0 fw-bold">₹{item.total}</h5>
                                </div>
                            ))}
                        </div>
                        <div className="divider-line my-4" />
                        <div className="summary-list">
                            <div className="summary-item">
                                <h6 className="mb-0">Subtotal</h6>
                                <h5 className="mb-0">₹{subtotal}</h5>
                            </div>
                            <div className="summary-item">
                                <h6 className="mb-0">Discount</h6>
                                <h5 className="mb-0 text-success">
                                    {discountAmount > 0 ? "−" : ""}₹{discountAmount}
                                </h5>
                            </div>
                            <div className="summary-item">
                                <h6 className="mb-0">Shipping</h6>
                                <h5 className="mb-0">₹{shippingCharge}</h5>
                            </div>
                            <div className="summary-item">
                                <h6 className="mb-0">Tax</h6>
                                <h5 className="mb-0">₹{taxAmount}</h5>
                            </div>
                            <div className="summary-item">
                                <h6 className="mb-0 text-danger fw-bold">Total</h6>
                                <h5 className="mb-0 fw-bold">₹{total}</h5>
                            </div>
                        </div>
                    </div>
                )}

                {orderDetails && (
                    <div className="review-card form mb-4">
                        <div className="body-head mb-3">
                            <h5 className="mb-0">Shipping Information</h5>
                        </div>
                        <div className="row row-gap-3">
                            <div className="col-md-6">
                                <label>Delivery Address</label>
                                <h6 className="mb-1">{customerName}</h6>
                                <h6 className="mb-1">+91 {customerPhone}</h6>
                                <h6 className="mb-0">{shippingAddress}</h6>
                            </div>
                            <div className="col-md-6">
                                <label>Delivery Method</label>
                                <h6 className="mb-0">Standard Delivery (3-5 business days)</h6>
                            </div>
                        </div>
                    </div>
                )}

                <div className="d-flex align-items-center justify-content-center flex-wrap gap-4">
                    <button className="buy-btn" onClick={() => router.push("/")}>
                        <i className="fas fa-shopping-bag me-1" /> Continue Shopping
                    </button>
                    {status === "failed" && (
                        <button
                            className="cart-btn"
                            onClick={() => router.push("/checkout")}
                        >
                            <i className="fas fa-rotate-left me-1" /> Try Again
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ReviewPage() {
    return (
        <Suspense
            fallback={
                <div className="text-center py-5">
                    <div className="spinner-border text-main" />
                    <h6 className="mt-3">Loading Order...</h6>
                </div>
            }
        >
            <ReviewPageContent />
        </Suspense>
    );
}