// app/components/profile/orders.tsx
"use client";

import { useEffect, useState } from "react";
import { getOrdersByUser, getOrderById } from "@/app/lib/api";

import "./orders.css";
import "./stepper.css";

interface OrderListItem {
    id: number;
    orderNumber: string;
    amount: number;
    createdAt: string;
    deliveryStatus: string;
    paymentMethod: string;
}

function formatDate(dateStr: string, style: "medium" | "mediumDate" = "mediumDate") {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return style === "medium"
        ? d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
        : d.toLocaleDateString("en-IN", { dateStyle: "medium" });
}

export default function Orders() {
    const [activeTab, setActiveTab] = useState(0);
    const [showDetails, setShowDetails] = useState(false);

    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [allOrders, setAllOrders] = useState<OrderListItem[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

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
        };
    }

    const activeOrders = allOrders.filter((o) => !["Cancelled", "Completed"].includes(o.deliveryStatus));
    const cancelledOrders = allOrders.filter((o) => o.deliveryStatus === "Cancelled");
    const completedOrders = allOrders.filter((o) => o.deliveryStatus === "Completed");

    async function viewDetails(order: OrderListItem) {
        setShowDetails(true);
        setLoadingDetails(true);
        try {
            const res = await getOrderById<any>(order.id);
            setSelectedOrder(res?.data ?? null);
        } catch {
            // silent
        } finally {
            setLoadingDetails(false);
        }
    }

    function backToOrders() {
        setShowDetails(false);
        setSelectedOrder(null);
    }

    const detailItems = (selectedOrder?.items || []).map((i: any) => ({
        name: i.product_name ?? "",
        color: i.color ?? "",
        size: i.size ?? "",
        qty: i.quantity ?? 1,
        total: Number(i.total ?? 0),
        image: i.image ?? "/assets/images/no-image.png",
    }));

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
                    <div className="col-md-4">
                        <button className="login-btn" onClick={() => viewDetails(order)}>View Details</button>
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
                            <div className={`step ${detailDeliveryStatus === "Pending" ? "active" : ""}`}>
                                <div className="step-circle">1</div>
                                <span className="step-label">Order Placed</span>
                            </div>
                            <div className="connector"></div>
                            <div className={`step ${detailDeliveryStatus === "Processing" ? "active" : ""}`}>
                                <div className="step-circle">2</div>
                                <span className="step-label">In Progress</span>
                            </div>
                            <div className="connector"></div>
                            <div className={`step ${detailDeliveryStatus === "Shipped" ? "active" : ""}`}>
                                <div className="step-circle">3</div>
                                <span className="step-label">Shipped</span>
                            </div>
                            <div className="connector"></div>
                            <div className={`step ${detailDeliveryStatus === "Completed" ? "active" : ""}`}>
                                <div className="step-circle">4</div>
                                <span className="step-label">Completed</span>
                            </div>
                        </div>

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