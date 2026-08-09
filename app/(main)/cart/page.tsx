// app/(main)/cart/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import Products from "@/app/components/product/product";
import { getCart, updateCartItem, removeCartItem, getRecentlyViewed } from "@/app/lib/api";
import { setOrderSummary } from "@/app/lib/checkout-store";
import { ProductItem } from "@/app/types/shop.models";
import "./page.css";

export interface CartItem {
    id: number;
    productId: number;
    productColorVariantId: number | null;
    productSizeStockId: number | null;
    name: string;
    description: string;
    price: number;
    mrp: number;
    discountType: "flat" | "percent" | null;
    discountValue: number;
    image: string;
    size: string;
    quantity: number;
    maxStock: number;
    availableSizes: string[];
    colorName: string;
    colorCode: string;
}

const TAX_RATE = 0.18;
const DEFAULT_MAX_QTY = 10;
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COUPONS: Record<string, number> = { SAVE10: 10, SAVE20: 20, FLAT50: 50 };

function round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
function calcDiscountedPrice(mrp: number, discountType: "flat" | "percent" | null, discountValue: number): number {
    if (!discountType || !discountValue) return mrp;
    if (discountType === "flat") return Math.max(round2(mrp - discountValue), 0);
    if (discountType === "percent") return Math.max(round2(mrp - (mrp * discountValue) / 100), 0);
    return mrp;
}
function formatMoney(n: number): string {
    return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function mapRecentlyViewed(row: any): ProductItem {
    const product = row.product || row;
    const firstVariant = product.color_variants?.[0];
    const sortedImages = firstVariant?.gallery_images?.slice().sort((a: any, b: any) => a.sort_order - b.sort_order);
    const discount = Number(product.discount) || 0;
    return {
        id: product.id,
        title: product.name,
        subtitle: product.brand,
        image: sortedImages?.[0]?.image_url ?? "/assets/images/no-image.png",
        rating: 5,
        review: 0,
        sp: product.effective_price,
        mrp: Number(product.unit_price),
        badge: discount > 0 ? `${discount}% OFF` : "",
        color_variants: product.color_variants || [],
        category_id: product.category_id,
    };
}

export default function Cart() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [isRecentlyViewedLoading, setIsRecentlyViewedLoading] = useState(true);
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState("");
    const [couponError, setCouponError] = useState("");

    function userId() {
        return typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    }

    useEffect(() => {
        loadCart();
        loadRecentlyViewed();
    }, []);

    async function loadCart() {
        const uid = userId();
        if (!uid) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await getCart<any>(uid);
            const items = res?.data?.items || [];
            const mapped: CartItem[] = items.map((row: any) => {
                const variant = row.color_variant;
                const sortedImages = variant?.gallery_images?.slice().sort((a: any, b: any) => a.sort_order - b.sort_order);
                const mrp = round2(Number(row.product?.unit_price ?? 0));
                const discountType = (row.product?.discount_type as "flat" | "percent" | null) ?? null;
                const discountValue = Number(row.product?.discount ?? 0);
                const price = calcDiscountedPrice(mrp, discountType, discountValue);
                return {
                    id: row.id,
                    productId: row.product?.id ?? row.product_id,
                    productColorVariantId: row.product_color_variant_id ?? null,
                    productSizeStockId: row.product_size_stock_id ?? null,
                    name: row.product?.name ?? "",
                    description: row.product?.brand ?? "",
                    price,
                    mrp,
                    discountType,
                    discountValue,
                    image: sortedImages?.[0]?.image_url ?? "/assets/images/no-image.png",
                    size: row.size_stock?.size ?? "",
                    quantity: row.quantity ?? 1,
                    maxStock: Number(row.size_stock?.stock ?? DEFAULT_MAX_QTY),
                    availableSizes: variant?.size_stocks?.map((s: any) => s.size) ?? [row.size_stock?.size ?? ""],
                    colorName: variant?.color?.name ?? "",
                    colorCode: variant?.color?.code ?? "",
                };
            });
            setCartItems(mapped);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }

    async function loadRecentlyViewed() {
        const uid = userId();
        if (!uid) {
            setIsRecentlyViewedLoading(false);
            return;
        }
        setIsRecentlyViewedLoading(true);
        try {
            const res = await getRecentlyViewed<any>(uid);
            const rows = res?.data?.data ?? res?.data ?? [];
            setProducts(rows.map(mapRecentlyViewed));
        } catch (err) {
            console.error("Error fetching recently viewed:", err);
        } finally {
            setIsRecentlyViewedLoading(false);
        }
    }

    // ---------- Calculations ----------
    const subtotal = round2(cartItems.reduce((sum, item) => sum + item.mrp * item.quantity, 0));
    const productDiscountTotal = round2(
        cartItems.reduce((sum, item) => sum + (item.mrp - item.price) * item.quantity, 0)
    );
    const discountPercent = appliedCoupon ? COUPONS[appliedCoupon] ?? 0 : 0;
    const postProductDiscountAmount = round2(subtotal - productDiscountTotal);
    const couponDiscountAmount = round2((postProductDiscountAmount * discountPercent) / 100);
    const discountAmount = round2(productDiscountTotal + couponDiscountAmount);
    const taxableAmount = round2(postProductDiscountAmount - couponDiscountAmount);
    const taxAmount = round2(taxableAmount * TAX_RATE);
    const total = round2(taxableAmount + taxAmount);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    function itemTotal(item: CartItem): number {
        return round2(item.price * item.quantity);
    }

    // ---------- Cart actions (optimistic UI + rollback) ----------
    async function syncQuantity(itemId: number, newQty: number, previousQty: number) {
        const uid = userId();
        if (!uid) return;
        try {
            await updateCartItem(uid, itemId, { quantity: newQty });
        } catch {
            setCartItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: previousQty } : i)));
            toast.error("Failed to update quantity.");
        }
    }
    function increaseQty(item: CartItem) {
        if (item.quantity >= item.maxStock) return;
        const prev = item.quantity;
        const next = prev + 1;
        setCartItems((cur) => cur.map((i) => (i.id === item.id ? { ...i, quantity: next } : i)));
        syncQuantity(item.id, next, prev);
    }
    function decreaseQty(item: CartItem) {
        if (item.quantity <= 1) return;
        const prev = item.quantity;
        const next = prev - 1;
        setCartItems((cur) => cur.map((i) => (i.id === item.id ? { ...i, quantity: next } : i)));
        syncQuantity(item.id, next, prev);
    }
    function onQtyInput(item: CartItem, e: React.ChangeEvent<HTMLInputElement>) {
        const raw = parseInt(e.target.value, 10);
        const prev = item.quantity;
        if (isNaN(raw)) {
            e.target.value = String(item.quantity);
            return;
        }
        const clamped = Math.min(Math.max(raw, 1), item.maxStock);
        setCartItems((cur) => cur.map((i) => (i.id === item.id ? { ...i, quantity: clamped } : i)));
        if (clamped !== prev) syncQuantity(item.id, clamped, prev);
    }

    // ---------- Size ----------
    async function onSizeChange(item: CartItem, e: React.ChangeEvent<HTMLSelectElement>) {
        const newSize = e.target.value;
        const prevSize = item.size;
        if (!newSize || newSize === prevSize) return;
        setCartItems((cur) => cur.map((i) => (i.id === item.id ? { ...i, size: newSize } : i)));
        const uid = userId();
        if (!uid) return;
        try {
            await updateCartItem(uid, item.id, { size: newSize });
        } catch {
            setCartItems((cur) => cur.map((i) => (i.id === item.id ? { ...i, size: prevSize } : i)));
            toast.error("Failed to update size.");
        }
    }

    async function removeItem(id: number) {
        const uid = userId();
        if (!uid) return;
        const removed = cartItems.find((i) => i.id === id);
        setCartItems((prev) => {
            const next = prev.filter((item) => item.id !== id);
            if (next.length === 0) {
                setAppliedCoupon("");
                setCouponCode("");
            }
            return next;
        });
        try {
            await removeCartItem(uid, id);
            toast.success("Removed from cart");
        } catch {
            if (removed) setCartItems((prev) => [...prev, removed]);
            toast.error("Failed to remove item.");
        }
    }

    // ---------- Coupon ----------
    function applyCoupon() {
        const code = couponCode.trim().toUpperCase();
        setCouponError("");
        if (!code) {
            setCouponError("Please enter a coupon code.");
            return;
        }
        if (COUPONS[code] !== undefined) {
            setAppliedCoupon(code);
            setCouponCode("");
        } else {
            setCouponError("Invalid coupon code. Try SAVE10, SAVE20, or FLAT50.");
            setAppliedCoupon("");
        }
    }
    function removeCoupon() {
        setAppliedCoupon("");
        setCouponCode("");
        setCouponError("");
    }

    function goBack() {
        router.back();
    }

    function proceedToCheckout() {
        if (cartItems.length === 0) return;
        setOrderSummary({
            items: cartItems.map((i) => ({
                name: i.name,
                qty: i.quantity,
                price: i.price,
                mrp: i.mrp,
                discountType: i.discountType,
                discountValue: i.discountValue,
                image: i.image,
                size: i.size,
                productId: i.productId,
                productColorVariantId: i.productColorVariantId,
                productSizeStockId: i.productSizeStockId,
            })),
            subtotal,
            discountAmount,
            taxAmount,
            total,
            couponCode: appliedCoupon || undefined,
        });
        router.push("/checkout");
    }

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-main"></div>
                <h6 className="mt-3">Loading Cart...</h6>
            </div>
        );
    }

    // Reusable size select block
    const renderSizeSelect = (item: CartItem) =>
        item.size ? (
            <select className="form-select" value={item.size} disabled onChange={() => {}}>
                <option value={item.size}>{item.size}</option>
            </select>
        ) : (
            <select className="form-select" value={item.size} onChange={(e) => onSizeChange(item, e)}>
                <option value="">Select Size</option>
                {SIZES.map((s) => (
                    <option key={s} value={s}>
                        {s}
                    </option>
                ))}
            </select>
        );

    const orderSummaryBlock = (
        <div className="cart-right">
            <div className="body-head mb-3">
                <h5 className="mb-0">Order Summary</h5>
            </div>
            <div className="summary-list mb-3">
                <div className="summary-item">
                    <h6 className="mb-0">Subtotal</h6>
                    <h5 className="mb-0">₹{formatMoney(subtotal)}</h5>
                </div>
                <div className="summary-item">
                    <h6 className="mb-0">
                        Discount
                        {appliedCoupon && (
                            <span className="badge-coupon ms-1">{appliedCoupon} ({discountPercent}%)</span>
                        )}
                    </h6>
                    <h5 className="mb-0 text-success">
                        {discountAmount > 0 && <span>− </span>}₹{formatMoney(discountAmount)}
                    </h5>
                </div>
                <div className="summary-item">
                    <h6 className="mb-0">GST (18%, included in price)</h6>
                    <h5 className="mb-0">₹{formatMoney(taxAmount)}</h5>
                </div>
                <hr className="my-3" />
                <div className="summary-item">
                    <h6 className="mb-0 text-danger">Total</h6>
                    <h5 className="mb-0 fw-bold">₹{formatMoney(total)}</h5>
                </div>
            </div>
            <button className="login-btn w-100 mb-3" onClick={proceedToCheckout} disabled={cartItems.length === 0}>
                Proceed to Checkout
            </button>
            <div className="summary-item d-flex align-items-center justify-content-center flex-wrap gap-4">
                <h6 className="mb-0"><i className="fa-solid fa-lock me-1"></i> Secure Checkout</h6>
                <h6 className="mb-0"><i className="fa-solid fa-shield me-1"></i> Payment Protected</h6>
            </div>
        </div>
    );

    return (
        <div className="cart my-4">
            {/* Breadcrumb */}
            <div className="body-head mb-4">
                <h6 className="d-flex align-items-center column-gap-2 mb-0">
                    <Link href="/">Home <i className="fas fa-chevron-right ps-1"></i></Link>
                    <a className="active">Cart</a>
                </h6>
            </div>
            {/* Web layout */}
            <div className="cart-div web-div">
                <div className="cart-left">
                    <div className="body-head mb-3">
                        <h5 className="mb-0 text-main">
                            Shopping Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
                        </h5>
                    </div>
                    <div className="table-div">
                        {cartItems.length === 0 && (
                            <div className="text-center text-muted py-5">
                                <i className="fas fa-shopping-cart fa-2x mb-3"></i>
                                <p className="mb-3">Your Cart is Empty.</p>
                                <Link href="/all-products" className="form-btn">Browse Products</Link>
                            </div>
                        )}
                        {cartItems.length > 0 && (
                            <table className="table table-responsive mb-3">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Size</th>
                                        <th>Quantity</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cartItems.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="product-cell">
                                                    <img src={item.image} alt={item.name} />
                                                    <div>
                                                        <h5 className="mb-2">{item.name}</h5>
                                                        <h6 className="mb-2">{item.description}</h6>
                                                        <h5 className="mb-2">
                                                            ₹{formatMoney(item.price)}
                                                            {item.mrp > item.price && (
                                                                <small className="text-muted text-decoration-line-through ms-1">
                                                                    ₹{formatMoney(item.mrp)}
                                                                </small>
                                                            )}
                                                        </h5>
                                                        <h6 className="mb-2">{item.colorName}</h6>
                                                        <a className="remove-link" onClick={() => removeItem(item.id)} style={{ cursor: "pointer" }}>
                                                            <i className="fa-solid fa-trash text-danger pe-1"></i> Remove
                                                        </a>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{renderSizeSelect(item)}</td>
                                            <td>
                                                <div className="qty-div">
                                                    <button className="qty-btn" onClick={() => decreaseQty(item)} disabled={item.quantity <= 1}>
                                                        −
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={item.maxStock}
                                                        value={item.quantity}
                                                        onChange={(e) => onQtyInput(item, e)}
                                                    />
                                                    <button
                                                        className="qty-btn"
                                                        onClick={() => increaseQty(item)}
                                                        disabled={item.quantity >= item.maxStock}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                {item.quantity >= item.maxStock && (
                                                    <h6 className="mt-1 mb-0">Max available stock reached</h6>
                                                )}
                                            </td>
                                            <td className="fw-semibold">₹{formatMoney(itemTotal(item))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {cartItems.length > 0 && (
                        <div className="body-head mt-4">
                            <h6 className="mb-0">
                                <a onClick={goBack} style={{ cursor: "pointer" }}>← Continue Shopping</a>
                            </h6>
                        </div>
                    )}
                </div>
                {orderSummaryBlock}
            </div>
            {/* Mobile layout */}
            <div className="cart-div mobile-div">
                <div className="cart-left">
                    <div className="body-head mb-3">
                        <h6 className="mb-0 text-main">
                            Shopping Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
                        </h6>
                    </div>
                    {cartItems.length === 0 && (
                        <div className="empty-cart text-center py-5">
                            <i className="fa-solid fa-cart-shopping fa-3x text-muted mb-3"></i>
                            <h5 className="text-muted">Your cart is empty</h5>
                            <p className="text-muted mb-3">Add items to get started</p>
                            <Link href="/all-products" className="login-btn">Browse Products</Link>
                        </div>
                    )}
                    <div className="table-div">
                        {cartItems.map((item) => (
                            <div className="mb-3" key={item.id}>
                                <div className="product-cell mb-2">
                                    <img src={item.image} alt={item.name} />
                                    <div>
                                        <h5 className="mb-2">{item.name}</h5>
                                        <h6 className="mb-2">{item.description}</h6>
                                        <h5 className="mb-2">
                                            ₹{formatMoney(item.price)}
                                            {item.mrp > item.price && (
                                                <small className="text-muted text-decoration-line-through ms-1">
                                                    ₹{formatMoney(item.mrp)}
                                                </small>
                                            )}
                                        </h5>
                                        <h6 className="mb-2">{item.colorName}</h6>
                                        <a className="remove-link" onClick={() => removeItem(item.id)} style={{ cursor: "pointer" }}>
                                            <i className="fa-solid fa-trash text-danger pe-1"></i> Remove
                                        </a>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center justify-content-between gap-2">
                                    {renderSizeSelect(item)}
                                    <div className="qty-div">
                                        <button className="qty-btn" onClick={() => decreaseQty(item)} disabled={item.quantity <= 1}>
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            min={1}
                                            max={item.maxStock}
                                            value={item.quantity}
                                            onChange={(e) => onQtyInput(item, e)}
                                        />
                                        <button
                                            className="qty-btn"
                                            onClick={() => increaseQty(item)}
                                            disabled={item.quantity >= item.maxStock}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <h6 className="mt-1 mb-0 fw-semibold text-end">₹{formatMoney(itemTotal(item))}</h6>
                            </div>
                        ))}
                    </div>
                </div>
                {orderSummaryBlock}
            </div>
            {/* Recently Viewed */}
            <div className="product-main my-4">
                <div className="product-div">
                    <div className="body-head mb-4">
                        <h4 className="text-center">Recently Viewed Products</h4>
                    </div>
                    {!isRecentlyViewedLoading && !products.length && (
                        <div className="text-center text-muted py-3">
                            <i className="fas fa-box-open fa-2x mb-3"></i>
                            <p className="mb-2">No Recently Viewed Products.</p>
                        </div>
                    )}
                    <div className="product-grid">
                        {products.map((item) => (
                            <Products key={item.id} product={item} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}