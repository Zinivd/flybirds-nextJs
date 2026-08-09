// app/components/profile/orders.tsx
"use client";
import { useEffect, useState } from "react";
import { getOrdersByUser, getOrderById, trackOrder } from "@/app/lib/api";
import "./orders.css";
import "./stepper.css";

interface OrderListItem {
    id: number;
    orderNumber: string;
    amount: number;
    createdAt: string;
    deliveryStatus: string;
    paymentMethod: string;
    awbNumber: string | null;
}

interface TrackingState {
    loading: boolean;
    error: string | null;
    shipmentStatus: string | null; // raw carrier status text, e.g. "In Transit"
    isNotShipped: boolean;
}

function formatDate(dateStr: string, style: "medium" | "mediumDate" = "mediumDate") {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return style === "medium"
        ? d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
        : d.toLocaleDateString("en-IN", { dateStyle: "medium" });
}

// Maps delivery_status to the 4-step stepper index used in the UI.
// "Packed" and "Out For Delivery" fold into the nearest adjacent step
// since the stepper only has 4 stages.
function statusToStepIndex(status: string): number {
    switch (status) {
        case "Pending":
            return 0;
        case "Packed":
            return 1;
        case "Shipped":
        case "Out For Delivery":
            return 2;
        case "Delivered":
        case "Completed":
            return 3;
        default:
            return 0;
    }
}

export default function Orders() {
    const [activeTab, setActiveTab] = useState(0);
    const [showDetails, setShowDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [allOrders, setAllOrders] = useState<OrderListItem[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [tracking, setTracking] = useState<TrackingState>({
        loading: false,
        error: null,
        shipmentStatus: null,
        isNotShipped: false,
    });

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await getOrdersByUser<any>(userId);
            const rows = res?.data ?? [];
            setAllOrders(rows.map(mapOrder));
        } catch {
            // silent, matches Angular original
        } finally {
            setLoading(false);
        }
    }

    function mapOrder(row: any): OrderListItem {
        return {
            id: row.id,
            orderNumber: row.order_id ?? "",
            amount: Number(row.amount ?? 0),
            createdAt: row.created_at ?? "",
            deliveryStatus: row.delivery_status ?? "Pending",
            paymentMethod: row.payment_method ?? "",
            awbNumber: row.awb_number ?? null,
        };
    }

    const activeOrders = allOrders.filter((o) => !["Cancelled", "Completed"].includes(o.deliveryStatus));
    const cancelledOrders = allOrders.filter((o) => o.deliveryStatus === "Cancelled");
    const completedOrders = allOrders.filter((o) => o.deliveryStatus === "Completed");

    async function viewDetails(order: OrderListItem) {
        setShowDetails(true);
        setLoadingDetails(true);
        setTracking({ loading: false, error: null, shipmentStatus: null, isNotShipped: false });
        try {
            const res = await getOrderById<any>(order.id);
            const data = res?.data ?? null;
            setSelectedOrder(data);
            // Auto-fetch live tracking once details load, only if the
            // order actually has an AWB (i.e. has shipped).
            if (data?.awb_number) {
                fetchTracking(data.order_id);
            }
        } catch {
            // silent
        } finally {
            setLoadingDetails(false);
        }
    }

    async function fetchTracking(orderNumber: string) {
        const userId = localStorage.getItem("userId");
        if (!userId || !orderNumber) return;
        setTracking((t) => ({ ...t, loading: true, error: null }));
        try {
            const res = await trackOrder<any>(orderNumber, userId);
            if (res?.status !== "success") {
                setTracking({
                    loading: false,
                    error: res?.message || "Unable to fetch tracking status right now.",
                    shipmentStatus: null,
                    isNotShipped: false,
                });
                return;
            }
            const shipmentStatus = res?.data?.shipment_status ?? null;
            setTracking({
                loading: false,
                error: null,
                shipmentStatus: shipmentStatus === "not_shipped" ? null : shipmentStatus,
                isNotShipped: shipmentStatus === "not_shipped",
            });
        } catch (err: any) {
            setTracking({
                loading: false,
                error: err?.error?.message || "Unable to fetch tracking status right now.",
                shipmentStatus: null,
                isNotShipped: false,
            });
        }
    }

    function backToOrders() {
        setShowDetails(false);
        setSelectedOrder(null);
        setTracking({ loading: false, error: null, shipmentStatus: null, isNotShipped: false });
    }

   const detailItems = (selectedOrder?.items || []).map((i: any) => {
    const galleryImages =
        i.product_color_variant?.gallery_images?.map((g: any) => g.image_url) ??
        i.product_details?.color?.gallery_images ??
        [];

    return {
        name: i.product_name ?? "",
        color: i.color ?? "",
        size: i.size ?? "",
        qty: i.quantity ?? 1,
        total: Number(i.total ?? 0),
        image: galleryImages[0] ?? "/assets/images/no-image.png",
    };
});

    const detailSubtotal = Number(selectedOrder?.subtotal ?? 0);
    const detailDiscount = Number(selectedOrder?.discount ?? 0);
    const detailShipping = Number(selectedOrder?.shipping ?? 0);
    const detailTax = Number(selectedOrder?.tax ?? 0);
    const detailTotal = Number(selectedOrder?.amount ?? 0);
    const detailOrderNumber = selectedOrder?.order_id ?? "";
    const detailOrderDate = selectedOrder?.created_at ?? "";
    const detailCustomerName = selectedOrder?.customer_name ?? "";
    const detailCustomerPhone = selectedOrder?.customer_phone ?? "";
    const detailShippingAddress = selectedOrder?.shipping_address ?? "";
    const detailDeliveryStatus = selectedOrder?.delivery_status ?? "";
    const detailPaymentMethod = selectedOrder?.payment_method ?? "";
    const detailAwbNumber = selectedOrder?.awb_number ?? null;
    const activeStepIndex = statusToStepIndex(detailDeliveryStatus);

    function renderOrderCard(order: OrderListItem, showPaymentMethod: boolean) {
        return (
            <div className="order-card mb-3" key={order.id}>
                <div className="body-head mb-3">
                    <h5 className="mb-0 text-main">Order {order.orderNumber}</h5>
                </div>
                <div className="row row-gap-3">
                    <div className="col-md-4">
                        <label>Order ID</label>
                        <h6 className="mb-0">{order.orderNumber}</h6>
                    </div>
                    <div className="col-md-4">
                        <label>Order Date</label>
                        <h6 className="mb-0">{formatDate(order.createdAt)}</h6>
                    </div>
                    {showPaymentMethod ? (
                        <div className="col-md-4">
                            <label>Order Status</label>
                            <h6 className="mb-0">{order.deliveryStatus}</h6>
                        </div>
                    ) : null}
                    {showPaymentMethod && (
                        <div className="col-md-4">
                            <label>Payment Method</label>
                            <h6 className="mb-0">{order.paymentMethod}</h6>
                        </div>
                    )}
                    <div className="col-md-4">
                        <label>Amount</label>
                        <h6 className="mb-0">₹{order.amount}</h6>
                    </div>
                    <div className="col-md-4 d-flex align-items-end gap-2">
                        <button className="login-btn" onClick={() => viewDetails(order)}>View Details</button>
                        {order.awbNumber && (
                            <span className="awb-chip" title={`AWB: ${order.awbNumber}`}>
                                <i className="fas fa-truck-fast"></i> Shipped
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (showDetails) {
        return (
            <div className="order-details">
                <div className="body-head mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h5 className="mb-0 text-main">Order Details</h5>
                    <h6 className="mb-0">
                        <a onClick={backToOrders} style={{ cursor: "pointer" }}>Back</a>
                    </h6>
                </div>
                {loadingDetails && (
                    <div className="text-center py-5">
                        <div className="spinner-border text-main"></div>
                        <h6 className="mt-3">Loading Order Details...</h6>
                    </div>
                )}
                {!loadingDetails && selectedOrder && (
                    <>
                        <div className="order-card mb-3">
                            <div className="body-head d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div>
                                    <h5 className="mb-2">Order {detailOrderNumber}</h5>
                                    <h6 className="mb-0">Placed on {formatDate(detailOrderDate, "medium")}</h6>
                                </div>
                                <h4 className="mb-0">₹{detailTotal}</h4>
                            </div>
                        </div>

                        <div className="stepper mb-4">
                            <div className={`step ${activeStepIndex >= 0 ? "active" : ""} ${activeStepIndex > 0 ? "completed" : ""}`}>
                                <div className="step-circle">1</div>
                                <span className="step-label">Order Placed</span>
                            </div>
                            <div className={`connector ${activeStepIndex > 0 ? "completed" : ""}`}></div>
                            <div className={`step ${activeStepIndex === 1 ? "active" : ""} ${activeStepIndex > 1 ? "completed" : ""}`}>
                                <div className="step-circle">2</div>
                                <span className="step-label">In Progress</span>
                            </div>
                            <div className={`connector ${activeStepIndex > 1 ? "completed" : ""}`}></div>
                            <div className={`step ${activeStepIndex === 2 ? "active" : ""} ${activeStepIndex > 2 ? "completed" : ""}`}>
                                <div className="step-circle">3</div>
                                <span className="step-label">Shipped</span>
                            </div>
                            <div className={`connector ${activeStepIndex > 2 ? "completed" : ""}`}></div>
                            <div className={`step ${activeStepIndex === 3 ? "active" : ""}`}>
                                <div className="step-circle">4</div>
                                <span className="step-label">Completed</span>
                            </div>
                        </div>

                        {/* Live Tracking — only shown once the order has an AWB */}
                        {detailAwbNumber && (
                            <div className="order-card mb-3 tracking-card">
                                <div className="body-head mb-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <div>
                                        <h5 className="mb-1">Live Tracking</h5>
                                        <h6 className="mb-0 text-muted font-monospace">AWB: {detailAwbNumber}</h6>
                                    </div>
                                    <button
                                        className="track-refresh-btn"
                                        disabled={tracking.loading}
                                        onClick={() => fetchTracking(detailOrderNumber)}
                                    >
                                        <i className={`fas fa-rotate ${tracking.loading ? "fa-spin" : ""}`}></i>
                                        {tracking.loading ? " Refreshing..." : " Refresh"}
                                    </button>
                                </div>
                                {tracking.loading && !tracking.shipmentStatus && !tracking.error && (
                                    <div className="tracking-status-row">
                                        <span className="dot-loading"></span>
                                        <h6 className="mb-0 text-muted">Fetching latest status...</h6>
                                    </div>
                                )}
                                {!tracking.loading && tracking.error && (
                                    <div className="tracking-status-row tracking-error">
                                        <i className="fas fa-triangle-exclamation"></i>
                                        <h6 className="mb-0">{tracking.error}</h6>
                                    </div>
                                )}
                                {!tracking.loading && !tracking.error && tracking.shipmentStatus && (
                                    <div className="tracking-status-row tracking-ok">
                                        <i className="fas fa-circle-check"></i>
                                        <h6 className="mb-0">
                                            Current status: <span className="fw-bold">{tracking.shipmentStatus}</span>
                                        </h6>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="review-div">
                            <div className="form mb-3">
                                <div className="row row-gap-3">
                                    <div className="col-md-4">
                                        <label>Order ID</label>
                                        <h5 className="mb-0">{detailOrderNumber}</h5>
                                    </div>
                                    <div className="col-md-4">
                                        <label>Order Date</label>
                                        <h5 className="mb-0">{formatDate(detailOrderDate)}</h5>
                                    </div>
                                    <div className="col-md-4">
                                        <label>Payment Method</label>
                                        <h5 className="mb-0">{detailPaymentMethod}</h5>
                                    </div>
                                </div>
                                <div className="divider-line my-4"></div>
                                <div className="body-head mb-4">
                                    <h5 className="mb-0">Order Summary</h5>
                                </div>
                                <div className="summary-list">
                                    {detailItems.map((item: any, i: number) => (
                                        <div className="summary-item" key={i}>
                                            <div className="product-cell">
                                                <img src={item.image} alt={item.name} />
                                                <div>
                                                    <h5 className="mb-1">{item.name}</h5>
                                                    <h6 className="mb-1 text-muted">{item.color} &nbsp;·&nbsp; Size: {item.size}</h6>
                                                    <h6 className="mb-0">x {item.qty}</h6>
                                                </div>
                                            </div>
                                            <h5 className="mb-0 fw-bold">₹{item.total}</h5>
                                        </div>
                                    ))}
                                </div>
                                <div className="divider-line my-4"></div>
                                <div className="summary-list">
                                    <div className="summary-item">
                                        <h6 className="mb-0">Subtotal</h6>
                                        <h5 className="mb-0">₹{detailSubtotal}</h5>
                                    </div>
                                    <div className="summary-item">
                                        <h6 className="mb-0">Discount</h6>
                                        <h5 className="mb-0 text-success">{detailDiscount > 0 ? "−" : ""}₹{detailDiscount}</h5>
                                    </div>
                                    <div className="summary-item">
                                        <h6 className="mb-0">Shipping</h6>
                                        <h5 className="mb-0">₹{detailShipping}</h5>
                                    </div>
                                    <div className="summary-item">
                                        <h6 className="mb-0">Tax</h6>
                                        <h5 className="mb-0">₹{detailTax}</h5>
                                    </div>
                                    <div className="summary-item">
                                        <h6 className="mb-0 text-danger fw-bold">Total</h6>
                                        <h5 className="mb-0 fw-bold">₹{detailTotal}</h5>
                                    </div>
                                </div>
                            </div>
                            <div className="divider-line my-4"></div>
                            <div className="form mb-4">
                                <div className="body-head mb-3">
                                    <h5 className="mb-0">Shipping Information</h5>
                                </div>
                                <div className="row row-gap-3">
                                    <div className="col-md-6">
                                        <label>Delivery Address</label>
                                        <h6 className="mb-1">{detailCustomerName}</h6>
                                        <h6 className="mb-1">+91 {detailCustomerPhone}</h6>
                                        <h6 className="mb-0">{detailShippingAddress}</h6>
                                    </div>
                                    <div className="col-md-6">
                                        <label>Delivery Method</label>
                                        <h6 className="mb-0">Standard Delivery (3-5 business days)</h6>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div>
            <div className="body-head mb-4">
                <h5 className="mb-2 text-main">My Orders</h5>
                <h6 className="mb-0">Check your orders and payments</h6>
            </div>
            {loading && (
                <div className="text-center py-5">
                    <div className="spinner-border text-main"></div>
                    <h6 className="mt-3">Loading Orders...</h6>
                </div>
            )}
            {!loading && (
                <>
                    <ul className="nav nav-tabs order-tabs justify-content-between mb-4">
                        <li className="nav-item">
                            <button className={`nav-link ${activeTab === 0 ? "active" : ""}`} onClick={() => setActiveTab(0)}>
                                Active
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${activeTab === 1 ? "active" : ""}`} onClick={() => setActiveTab(1)}>
                                Cancelled
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${activeTab === 2 ? "active" : ""}`} onClick={() => setActiveTab(2)}>
                                Completed
                            </button>
                        </li>
                    </ul>
                    <div className="tab-content form">
                        <div className={`tab-pane ${activeTab === 0 ? "active" : ""}`}>
                            {activeOrders.map((order) => renderOrderCard(order, true))}
                            {!activeOrders.length && (
                                <div className="text-center text-muted py-4">
                                    <i className="fas fa-truck-fast fa-2x mb-3"></i>
                                    <p className="mb-0">No Active Orders.</p>
                                </div>
                            )}
                        </div>
                        <div className={`tab-pane ${activeTab === 1 ? "active" : ""}`}>
                            {cancelledOrders.map((order) => renderOrderCard(order, false))}
                            {!cancelledOrders.length && (
                                <div className="text-center text-muted py-4">
                                    <i className="fas fa-circle-xmark fa-2x mb-3"></i>
                                    <p className="mb-0">No Cancelled Orders.</p>
                                </div>
                            )}
                        </div>
                        <div className={`tab-pane ${activeTab === 2 ? "active" : ""}`}>
                            {completedOrders.map((order) => renderOrderCard(order, false))}
                            {!completedOrders.length && (
                                <div className="text-center text-muted py-4">
                                    <i className="fas fa-circle-check fa-2x mb-3"></i>
                                    <p className="mb-0">No Completed Orders.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}