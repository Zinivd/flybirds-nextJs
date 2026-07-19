"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { API_URL, verifyPayment } from "@/app/lib/api";
import { getOrderSummary, CheckoutOrderSummary } from "@/app/lib/checkout-store";
import { toast } from "react-toastify";
import Stepper from "@/app/(main)/stepper/stepper";

import "./page.css";

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface PaymentMethod {
    id: number;
    label: string;
    name: string;
    isDefault: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = [
    {
        id: 1,
        label: "Razorpay",
        name: "Pay via UPI (GPay, PhonePe, Paytm)",
        isDefault: true,
    },
];

function PaymentPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const orderId = searchParams.get("orderId");

    const [selectedPaymentId, setSelectedPaymentId] = useState<number>(
        PAYMENT_METHODS.find((p) => p.isDefault)?.id ?? -1,
    );
    const [processing, setProcessing] = useState(false);

    const [orderSummary, setOrderSummary] = useState<CheckoutOrderSummary>({
        items: [],
        subtotal: 0,
        discountAmount: 0,
        shippingCharge: 0,
        taxAmount: 0,
        total: 0,
    });

    useEffect(() => {
        const summary = getOrderSummary();
        if (summary) setOrderSummary(summary);
    }, []);

    useEffect(() => {
        if (!orderId) toast.error("No order found. Please start checkout again.");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    const totalItems = orderSummary.items.reduce((sum, i) => sum + i.qty, 0);

    function selectPayment(id: number) {
        setSelectedPaymentId(id);
    }

    function proceedToReview() {
        const selected = PAYMENT_METHODS.find((p) => p.id === selectedPaymentId);
        if (!selected) return;
        if (!orderId) {
            toast.error("No order found. Please start checkout again.");
            return;
        }
        payWithRazorpay();
    }

    function payWithRazorpay() {
        setProcessing(true);
        fetch(`${API_URL}/payment/create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: orderSummary.total,
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
                        handler: (paymentResponse: any) =>
                            verifyRazorpayPayment(paymentResponse),
                        prefill: {
                            name: "Customer Name",
                            email: "customer@example.com",
                            contact: "9999999999",
                        },
                        theme: { color: "#c4b5fd" },
                    };
                    const rzp = new window.Razorpay(options);
                    rzp.on("payment.failed", (failedResponse: any) => {
                        toast.error(
                            "Payment Failed: " + failedResponse.error.description,
                        );
                        router.push(`/review?orderId=${orderId}&status=failed`);
                    });
                    rzp.open();
                    setProcessing(false);
                } else {
                    setProcessing(false);
                    toast.error(
                        "Failed to initiate payment: " +
                        (response.message || "Unknown error"),
                    );
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
                const success =
                    response?.status === "success" &&
                    response?.data?.payment_status === "Paid";
                if (!success)
                    toast.warning(
                        "Payment verified but order could not be confirmed as Paid.",
                    );
                router.push(
                    `/review?orderId=${orderId}&status=${success ? "success" : "failed"}`,
                );
            })
            .catch(() => {
                router.push(`/review?orderId=${orderId}&status=failed`);
            });
    }

    return (
        <>
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="afterInteractive"
            />
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
                                    className={`address-item ${selectedPaymentId === method.id ? "selected" : ""
                                        }`}
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
                            <h6 className="mb-0">
                                <i className="fa-solid fa-shield me-1" /> SSL Protected
                            </h6>
                            <img
                                src="/assets/images/BrandLogo/Razorpay.png"
                                className="brand-logo"
                                alt="Razorpay"
                            />
                            <img
                                src="/assets/images/BrandLogo/Delhivery.png"
                                className="brand-logo"
                                alt="Delhivery"
                            />
                            <h6 className="mb-0">
                                <i className="fa-solid fa-shield-halved me-1" /> 100% Refund
                                Guarantee
                            </h6>
                        </div>
                    </div>

                    <div className="checkout-right h-auto">
                        <div className="body-head mb-4">
                            <h5 className="mb-0">Order Summary</h5>
                            <small className="text-muted">
                                {totalItems} {totalItems === 1 ? "item" : "items"}
                            </small>
                        </div>

                        <div className="summary-list">
                            {orderSummary.items.map((item, idx) => (
                                <div className="summary-item" key={idx}>
                                    <div className="product-cell">
                                        <img src={item.image} alt={item.name} />
                                        <div>
                                            <h5 className="mb-1">{item.name}</h5>
                                            <h6 className="mb-1">x {item.qty}</h6>
                                            <p className="text-muted my-0">{item.size}</p>
                                        </div>
                                    </div>
                                    <h5>₹{item.price * item.qty}</h5>
                                </div>
                            ))}

                            <hr className="my-3" />

                            <div className="summary-item">
                                <h6 className="mb-0">Subtotal</h6>
                                <h5 className="mb-0">₹{orderSummary.subtotal}</h5>
                            </div>
                            <div className="summary-item">
                                <h6 className="mb-0">Discount</h6>
                                <h5 className="mb-0 text-success">
                                    {orderSummary.discountAmount > 0 ? "−" : ""}₹
                                    {orderSummary.discountAmount}
                                </h5>
                            </div>
                            <div className="summary-item">
                                <h6 className="mb-0">Shipping</h6>
                                <h5 className="mb-0">
                                    {orderSummary.shippingCharge === 0 ? (
                                        <span className="text-success">Free</span>
                                    ) : (
                                        <span>₹{orderSummary.shippingCharge}</span>
                                    )}
                                </h5>
                            </div>
                            <div className="summary-item">
                                <h6 className="mb-0">Tax (GST 18%)</h6>
                                <h5 className="mb-0">₹{orderSummary.taxAmount}</h5>
                            </div>

                            <hr className="my-3" />

                            <div className="summary-item">
                                <h6 className="mb-0 text-danger fw-bold">Total</h6>
                                <h5 className="mb-0 fw-bold">₹{orderSummary.total}</h5>
                            </div>

                            <button
                                className="login-btn w-100 mb-3"
                                disabled={selectedPaymentId === -1 || processing}
                                onClick={proceedToReview}
                            >
                                {processing ? "Processing..." : `Pay Now ₹${orderSummary.total}`}
                            </button>
                            <button
                                className="reset-btn w-100"
                                onClick={() => router.push("/cart")}
                            >
                                Back to Cart
                            </button>

                            <hr className="my-3" />

                            <div className="summary-item d-flex align-items-center justify-content-center flex-wrap gap-4">
                                <h6 className="mb-0">
                                    <i className="fa-solid fa-lock me-1" /> Secure Checkout
                                </h6>
                                <h6 className="mb-0">
                                    <i className="fa-solid fa-shield me-1" /> Payment Protected
                                </h6>
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