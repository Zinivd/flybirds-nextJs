"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import {
    API_URL,
    verifyPayment,
    getShippingQuote,
    confirmCodOrder,
    getOrderById,
} from "@/app/lib/api";
import { toast } from "react-toastify";
import Stepper from "@/app/(main)/stepper/stepper";
import "./page.css";

declare global {
    interface Window { Razorpay: any; }
}

interface PaymentMethod {
    id: number;
    label: string;
    name: string;
    isDefault: boolean;
    code: "razorpay" | "cod";
}

const PAYMENT_METHODS: PaymentMethod[] = [
    { id: 1, label: "Razorpay", name: "Pay via UPI (GPay, PhonePe, Paytm)", isDefault: true, code: "razorpay" },
    { id: 2, label: "Cash on Delivery", name: "Pay in cash when your order arrives", isDefault: false, code: "cod" },
];

const PLACEHOLDER_IMAGE = "/assets/images/no-image.png";

function resolveItemImage(item: any): string {
    const variantGallery = item?.product_color_variant?.gallery_images;
    if (Array.isArray(variantGallery) && variantGallery.length > 0) {
        const sorted = [...variantGallery].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        if (sorted[0]?.image_url) return sorted[0].image_url;
    }
    const variantThumb = item?.product_color_variant?.thumbnail_image?.image_url;
    if (variantThumb) return variantThumb;
    const detailsGallery = item?.product_details?.color?.gallery_images;
    if (Array.isArray(detailsGallery) && detailsGallery.length > 0 && detailsGallery[0]) return detailsGallery[0];
    return PLACEHOLDER_IMAGE;
}

function PaymentPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");

    const [selectedPaymentId, setSelectedPaymentId] = useState<number>(
        PAYMENT_METHODS.find((p) => p.isDefault)?.id ?? -1,
    );
    const [processing, setProcessing] = useState(false);
    const [orderLoading, setOrderLoading] = useState(true);
    const [order, setOrder] = useState<any>(null);
    const [shippingLoading, setShippingLoading] = useState(false);
    const [shippingError, setShippingError] = useState<string | null>(null);

    // Guards against a stale, slower request landing after a newer one.
    const requestIdRef = useRef(0);

    useEffect(() => {
        if (!orderId) {
            toast.error("No order found. Please start checkout again.");
            setOrderLoading(false);
            return;
        }
        getOrderById<any>(orderId)
            .then((res) => setOrder(res?.data ?? null))
            .catch(() => {
                toast.error("Couldn't load your order. Please try again.");
                setOrder(null);
            })
            .finally(() => setOrderLoading(false));
    }, [orderId]);

    const items = order?.items ?? [];
    const totalItems = items.reduce((sum: number, i: any) => sum + Number(i.quantity ?? 1), 0);
    const selectedMethod = PAYMENT_METHODS.find((p) => p.id === selectedPaymentId);

    // Every dollar figure below comes straight from `order` — the server's
    // own persisted numbers. Nothing is recomputed client-side.
    const subtotal = Number(order?.subtotal ?? 0);
    const discountAmount = Number(order?.discount ?? 0);
    const shippingCharge = Number(order?.shipping ?? 0);
    const taxAmount = Number(order?.tax ?? 0);
    const grandTotal = Number(order?.amount ?? 0);

    // Re-quote shipping from the server whenever the payment method changes.
    // The quote endpoint persists shipping/tax/amount on the order, then we
    // just re-fetch the order so the UI numbers always match what will be
    // charged. requestIdRef prevents a slow, stale response overwriting a
    // newer one if the user flips the radio quickly.
    useEffect(() => {
        if (!orderId || !order || !selectedMethod) return;
        const myRequestId = ++requestIdRef.current;
        setShippingLoading(true);
        setShippingError(null);
        getShippingQuote<any>(orderId, selectedMethod.code)
            .then(() => {
                if (myRequestId !== requestIdRef.current) return; // stale, ignore
                return getOrderById<any>(orderId).then((res) => {
                    if (myRequestId !== requestIdRef.current) return;
                    setOrder(res?.data ?? null);
                });
            })
            .catch((err : any) => {
                if (myRequestId !== requestIdRef.current) return;
                console.error(err);
                setShippingError("Couldn't calculate shipping right now.");
            })
            .finally(() => {
                if (myRequestId === requestIdRef.current) setShippingLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId, selectedMethod?.code]);

    function selectPayment(id: number) {
        setSelectedPaymentId(id);
    }

    function proceedToReview() {
        const selected = PAYMENT_METHODS.find((p) => p.id === selectedPaymentId);
        if (!selected || !orderId) {
            toast.error("No order found. Please start checkout again.");
            return;
        }
        if (selected.code === "cod") {
            payWithCod();
        } else {
            payWithRazorpay();
        }
    }

    function payWithCod() {
        if (!orderId) return;
        setProcessing(true);
        // Backend recomputes/re-confirms COD amount from its own quote — no
        // client-supplied money values are ever sent or trusted.
        confirmCodOrder<any>(orderId)
            .then((response) => {
                setProcessing(false);
                if (response?.status !== "success") {
                    toast.error("Failed to confirm COD order: " + (response?.message || "Unknown error"));
                    return;
                }
                router.push(`/order-success?orderId=${orderId}`);
            })
            .catch((err) => {
                console.error(err);
                setProcessing(false);
                toast.error(err?.error?.message || "Error confirming Cash on Delivery order.");
            });
    }

    function payWithRazorpay() {
        setProcessing(true);
        // grandTotal is the server's own persisted `order.amount` (already
        // re-quoted for Razorpay via the effect above) — never recomputed here.
        fetch(`${API_URL}/payment/create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: grandTotal,
                currency: "INR",
                order_table_id: orderId,
            }),
        })
            .then((res) => res.json())
            .then((response) => {
                if (response.status === "success") {
                    const options = {
                        key: response.data.key_id,
                        amount: response.data.amount,
                        currency: response.data.currency,
                        name: "Flybirds Leggings",
                        description: "Payment for your order",
                        image: "/assets/images/logo.png",
                        order_id: response.data.razorpay_order_id,
                        handler: (paymentResponse: any) => verifyRazorpayPayment(paymentResponse),
                        prefill: {
                            name: order?.customer_name ?? "Customer",
                            email: order?.customer_email ?? "",
                            contact: order?.customer_phone ?? "",
                        },
                        theme: { color: "#c4b5fd" },
                    };
                    const rzp = new window.Razorpay(options);
                    rzp.on("payment.failed", (failedResponse: any) => {
                        toast.error("Payment Failed: " + failedResponse.error.description);
                        router.push(`/review?orderId=${orderId}&status=failed`);
                    });
                    rzp.open();
                    setProcessing(false);
                } else {
                    setProcessing(false);
                    toast.error("Failed to initiate payment: " + (response.message || "Unknown error"));
                }
            })
            .catch((err) => {
                console.error(err);
                setProcessing(false);
                toast.error("Error connecting to backend payment service.");
            });
    }

    function verifyRazorpayPayment(paymentResponse: any) {
        verifyPayment<any>({
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
            order_table_id: orderId,
        })
            .then((response) => {
                const success = response?.status === "success" && response?.data?.payment_status === "Paid";
                if (!success) toast.warning("Payment verified but order could not be confirmed as Paid.");
                router.push(`/review?orderId=${orderId}&status=${success ? "success" : "failed"}`);
            })
            .catch(() => router.push(`/review?orderId=${orderId}&status=failed`));
    }

    if (orderLoading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-main" />
                <h6 className="mt-3">Loading Order...</h6>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-5">
                <h5 className="mb-3">We couldn&apos;t find that order.</h5>
            </div>
        );
    }

    const payButtonLabel = processing
        ? "Processing..."
        : selectedMethod?.code === "cod"
            ? "Place Order (COD)"
            : `Pay Now ₹${grandTotal.toFixed(2)}`;

    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
            <div className="checkout my-4">
                <Stepper current={2} />
                <div className="checkout-div">
                    <div className="checkout-left">
                        <div className="address-list mb-4">
                            <div className="body-head mb-3">
                                <h5 className="mb-0">Select Payment Method</h5>
                            </div>
                            {PAYMENT_METHODS.map((method) => (
                                <div
                                    key={method.id}
                                    className={`address-item ${selectedPaymentId === method.id ? "selected" : ""}`}
                                    onClick={() => selectPayment(method.id)}
                                >
                                    <input
                                        type="radio"
                                        id={`payment-${method.id}`}
                                        name="paymentMethod"
                                        checked={selectedPaymentId === method.id}
                                        onChange={() => selectPayment(method.id)}
                                    />
                                    <label htmlFor={`payment-${method.id}`} className="w-100">
                                        <h4 className="mb-2">{method.label}</h4>
                                        <h6 className="mb-0">{method.name}</h6>
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="divider-line my-4" />
                        <div className="summary-item d-flex align-items-center justify-content-center flex-wrap gap-4">
                            <h6 className="mb-0"><i className="fa-solid fa-shield me-1" /> SSL Protected</h6>
                            <img src="/assets/images/BrandLogo/Razorpay.png" className="brand-logo" alt="Razorpay" />
                            <img src="/assets/images/BrandLogo/Delhivery.png" className="brand-logo" alt="Delhivery" />
                            <h6 className="mb-0"><i className="fa-solid fa-shield-halved me-1" /> 100% Refund Guarantee</h6>
                        </div>
                    </div>
                    <div className="checkout-right h-auto">
                        <div className="body-head mb-4">
                            <h5 className="mb-0">Order Summary</h5>
                            <small className="text-muted">{totalItems} {totalItems === 1 ? "item" : "items"}</small>
                        </div>
                        <div className="summary-list">
                            {items.map((item: any, idx: number) => (
                                <div className="summary-item" key={item.id ?? idx}>
                                    <div className="product-cell">
                                        <img src={resolveItemImage(item)} alt={item.product_name} />
                                        <div>
                                            <h5 className="mb-1">{item.product_name}</h5>
                                            <h6 className="mb-1">x {item.quantity}</h6>
                                            <p className="text-muted my-0">{item.color} · {item.size}</p>
                                        </div>
                                    </div>
                                    <h5>₹{Number(item.total ?? 0)}</h5>
                                </div>
                            ))}
                            <hr className="my-3" />
                            <div className="summary-item">
                                <h6 className="mb-0">Subtotal</h6>
                                <h5 className="mb-0">₹{subtotal}</h5>
                            </div>
                            <div className="summary-item">
                                <h6 className="mb-0">Discount</h6>
                                <h5 className="mb-0 text-success">{discountAmount > 0 ? "−" : ""}₹{discountAmount}</h5>
                            </div>
                            <div className="summary-item">
                                <h6 className="mb-0">Shipping</h6>
                                <h5 className="mb-0">
                                    {shippingLoading ? (
                                        <span className="text-muted">Calculating...</span>
                                    ) : shippingCharge === 0 ? (
                                        <span className="text-success">Free</span>
                                    ) : (
                                        <span>₹{shippingCharge}</span>
                                    )}
                                </h5>
                            </div>
                            {shippingError && (
                                <div className="summary-item">
                                    <small className="text-danger">{shippingError}</small>
                                </div>
                            )}
                            <div className="summary-item">
                                <h6 className="mb-0">Tax (GST 18%)</h6>
                                <h5 className="mb-0">₹{taxAmount}</h5>
                            </div>
                            <hr className="my-3" />
                            <div className="summary-item">
                                <h6 className="mb-0 text-danger fw-bold">Total</h6>
                                <h5 className="mb-0 fw-bold">₹{grandTotal.toFixed(2)}</h5>
                            </div>
                            <button
                                className="login-btn w-100 mb-3"
                                disabled={selectedPaymentId === -1 || processing || shippingLoading}
                                onClick={proceedToReview}
                            >
                                {payButtonLabel}
                            </button>
                            <button className="reset-btn w-100" onClick={() => router.push("/cart")}>
                                Back to Cart
                            </button>
                            <hr className="my-3" />
                            <div className="summary-item d-flex align-items-center justify-content-center flex-wrap gap-4">
                                <h6 className="mb-0"><i className="fa-solid fa-lock me-1" /> Secure Checkout</h6>
                                <h6 className="mb-0"><i className="fa-solid fa-shield me-1" /> Payment Protected</h6>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function PaymentPage() {
    return (
        <Suspense
            fallback={
                <div className="text-center py-5">
                    <div className="spinner-border text-main" />
                    <h6 className="mt-3">Loading Payment...</h6>
                </div>
            }
        >
            <PaymentPageContent />
        </Suspense>
    );
}