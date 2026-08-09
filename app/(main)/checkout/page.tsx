"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    getUserInfo,
    createOrder,
    checkPincodeAvailability,
} from "@/app/lib/api";
import { getOrderSummary, CheckoutOrderSummary } from "@/app/lib/checkout-store";
import Stepper from "@/app/(main)/stepper/stepper";
import { toast } from "react-toastify";
import "./page.css";
export interface Address {
    id: number;
    label: string;
    name: string;
    mobile: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    type: "Home" | "Work" | "Other";
    isDefault: boolean;
}
interface AddressFormValues {
    name: string;
    mobile: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    type: "Home" | "Work" | "Other";
    isDefault: boolean;
}
const EMPTY_FORM: AddressFormValues = {
    name: "",
    mobile: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    type: "Home",
    isDefault: false,
};
function capitalize(s: string): "Home" | "Work" | "Other" {
    if (!s) return "Home";
    const v = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    return (["Home", "Work", "Other"].includes(v) ? v : "Home") as
        | "Home"
        | "Work"
        | "Other";
}
function mapAddress(row: any): Address {
    const type = capitalize(row.address_type);
    return {
        id: row.id,
        label: type,
        name: row.full_name ?? "",
        mobile: row.phone ?? "",
        addressLine1: row.address_line_1 ?? "",
        addressLine2: row.address_line_2 ?? "",
        city: row.city ?? "",
        state: row.state ?? "",
        pincode: row.postal_code ?? "",
        type,
        isDefault: !!row.is_default,
    };
}
function toApiPayload(v: AddressFormValues) {
    return {
        full_name: v.name,
        phone: v.mobile,
        address_line_1: v.addressLine1,
        address_line_2: v.addressLine2 || null,
        city: v.city,
        state: v.state,
        postal_code: v.pincode,
        country: "India",
        address_type: v.type.toLowerCase(),
        is_default: v.isDefault,
    };
}
function validate(v: AddressFormValues) {
    const errors: Partial<Record<keyof AddressFormValues, string>> = {};
    if (!v.name.trim()) errors.name = "Name is required.";
    else if (v.name.trim().length < 2) errors.name = "Name is too short.";
    if (!v.mobile.trim()) errors.mobile = "Phone is required.";
    else if (!/^\+?[0-9\-]{10,15}$/.test(v.mobile))
        errors.mobile = "Enter a valid mobile number.";
    if (!v.addressLine1.trim())
        errors.addressLine1 = "Address Line 1 is required.";
    if (!v.city.trim()) errors.city = "City is required.";
    if (!v.state.trim()) errors.state = "State is required.";
    if (!v.pincode.trim()) errors.pincode = "Pincode is required.";
    else if (!/^[0-9]{6}$/.test(v.pincode))
        errors.pincode = "Pincode must be 6 digits.";
    return errors;
}
function getUserId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("userId");
}
interface PincodeCheckResult {
    serviceable: boolean;
    codAvailable: boolean;
    prepaidAvailable: boolean;
}
export default function CheckoutAddressPage() {
    const router = useRouter();
    const userId = useMemo(() => getUserId(), []);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number>(-1);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<number | null>(
        null,
    );
    const [saving, setSaving] = useState(false);
    const [creatingOrder, setCreatingOrder] = useState(false);
    const [form, setForm] = useState<AddressFormValues>(EMPTY_FORM);
    const [touched, setTouched] = useState<
        Partial<Record<keyof AddressFormValues, boolean>>
    >({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [pincodeStatus, setPincodeStatus] = useState<
        "available" | "unavailable" | null
    >(null);
    const [pincodeResult, setPincodeResult] = useState<PincodeCheckResult | null>(
        null,
    );
    const [pincodeChecking, setPincodeChecking] = useState(false);
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerName, setCustomerName] = useState("");
   const [orderSummary, setOrderSummary] = useState<CheckoutOrderSummary>({
    items: [],
    subtotal: 0,
    discountAmount: 0,
    shippingCharge: 0,
    taxAmount: 0,
    total: 0,
})

    // ---------- Delivery availability check for the SELECTED address ----------
    const [deliveryStatus, setDeliveryStatus] = useState<
        "checking" | "available" | "unavailable" | null
    >(null);
    const [deliveryResult, setDeliveryResult] = useState<PincodeCheckResult | null>(
        null,
    );

    useEffect(() => {
        const summary = getOrderSummary();
        if (summary) setOrderSummary(summary);
    }, []);
    useEffect(() => {
        if (!userId) {
            setLoadingAddresses(false);
            return;
        }
        loadAddresses();
        loadUserInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Runs right after addresses are loaded (selectedAddressId changes) and
    // whenever the user picks a different saved address.
    useEffect(() => {
        const selected = addresses.find((a) => a.id === selectedAddressId);
        if (!selected || !selected.pincode) {
            setDeliveryStatus(null);
            setDeliveryResult(null);
            return;
        }
        checkAddressDeliverability(selected.pincode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAddressId, addresses]);

    function loadUserInfo() {
        if (!userId) return;
        getUserInfo<any>(userId)
            .then((res) => {
                const user = res?.data ?? res;
                setCustomerEmail(user?.email ?? "");
                setCustomerName(user?.name ?? user?.full_name ?? "");
            })
            .catch(() => console.error("Failed to load user info for checkout."));
    }
    function loadAddresses() {
        if (!userId) {
            setLoadingAddresses(false);
            return;
        }
        setLoadingAddresses(true);
        getAddresses<any>(userId)
            .then((res) => {
                const rows = res?.data || [];
                const mapped: Address[] = rows.map(mapAddress);
                setAddresses(mapped);
                const def = mapped.find((a) => a.isDefault);
                setSelectedAddressId(def?.id ?? mapped[0]?.id ?? -1);
            })
            .catch(() => toast.error("Failed to load addresses."))
            .finally(() => setLoadingAddresses(false));
    }

    // ---------- Delhivery pincode serviceability check for selected address ----------
    async function checkAddressDeliverability(pincode: string) {
        setDeliveryStatus("checking");
        setDeliveryResult(null);
        try {
            const res = await checkPincodeAvailability<any>(pincode);
            const data = res?.data ?? res;
            const result: PincodeCheckResult = {
                serviceable: !!data?.serviceable,
                codAvailable: !!data?.cod_available,
                prepaidAvailable: !!data?.prepaid_available,
            };
            setDeliveryResult(result);
            setDeliveryStatus(result.serviceable ? "available" : "unavailable");
        } catch {
            setDeliveryResult(null);
            setDeliveryStatus(null);
            toast.error("Could not verify delivery availability for this address.");
        }
    }

    const totalItems = orderSummary.items.reduce((sum, i) => sum + i.qty, 0);
    function selectAddress(id: number) {
        setSelectedAddressId(id);
    }
    function setDefault(id: number) {
        if (!userId) return;
        const prev = addresses;
        setAddresses((list) => list.map((a) => ({ ...a, isDefault: a.id === id })));
        updateAddress(userId, id, { is_default: true }).catch(() => {
            setAddresses(prev);
            toast.error("Failed to set default address.");
        });
    }
    function startEdit(address: Address) {
        setEditingAddressId(address.id);
        setForm({
            name: address.name,
            mobile: address.mobile,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            type: address.type,
            isDefault: address.isDefault,
        });
        setTouched({});
        setSubmitAttempted(false);
        setPincodeStatus(null);
        setPincodeResult(null);
        setShowAddressForm(true);
    }
    function removeAddress(id: number) {
        if (!userId) return;
        const removed = addresses.find((a) => a.id === id);
        const remaining = addresses.filter((a) => a.id !== id);
        setAddresses(remaining);
        if (selectedAddressId === id) {
            const def = remaining.find((a) => a.isDefault) || remaining[0];
            setSelectedAddressId(def?.id ?? -1);
        }
        deleteAddress(userId, id)
            .then(() => toast.success("Address removed."))
            .catch(() => {
                if (removed) setAddresses((list) => [...list, removed]);
                toast.error("Failed to delete address.");
            });
    }
    function toggleForm() {
        const next = !showAddressForm;
        setShowAddressForm(next);
        if (next) {
            setEditingAddressId(null);
            setForm(EMPTY_FORM);
            setTouched({});
            setSubmitAttempted(false);
            setPincodeStatus(null);
            setPincodeResult(null);
        }
    }
    function cancelForm() {
        setShowAddressForm(false);
        setEditingAddressId(null);
        setPincodeStatus(null);
        setPincodeResult(null);
        setForm(EMPTY_FORM);
        setTouched({});
        setSubmitAttempted(false);
    }
    function handleChange<K extends keyof AddressFormValues>(
        key: K,
        value: AddressFormValues[K],
    ) {
        setForm((f) => ({ ...f, [key]: value }));
        if (key === "pincode") {
            setPincodeStatus(null);
            setPincodeResult(null);
            const v = value as unknown as string;
            if (v.length === 6) checkPincodeDelivery(v);
        }
    }
    // ---------- Delhivery pincode serviceability check (used inside the add/edit form) ----------
    async function checkPincodeDelivery(pincode: string) {
        setPincodeChecking(true);
        setPincodeStatus(null);
        try {
            const res = await checkPincodeAvailability<any>(pincode);
            const data = res?.data ?? res;
            const result: PincodeCheckResult = {
                serviceable: !!data?.serviceable,
                codAvailable: !!data?.cod_available,
                prepaidAvailable: !!data?.prepaid_available,
            };
            setPincodeResult(result);
            setPincodeStatus(result.serviceable ? "available" : "unavailable");
        } catch {
            setPincodeResult(null);
            setPincodeStatus(null);
            toast.error("Could not verify delivery for this pincode. Please try again.");
        } finally {
            setPincodeChecking(false);
        }
    }
    const errors = validate(form);
    function isInvalid(field: keyof AddressFormValues) {
        return !!errors[field] && (touched[field] || submitAttempted);
    }
    function getError(field: keyof AddressFormValues) {
        return isInvalid(field) ? errors[field] : "";
    }
    function saveAddress() {
        setSubmitAttempted(true);
        if (Object.keys(errors).length > 0) return;
        if (pincodeStatus === "unavailable") {
            toast.error("Delivery is not available for this pincode.");
            return;
        }
        if (!userId) return;
        const payload = toApiPayload(form);
        setSaving(true);
        const request =
            editingAddressId !== null
                ? updateAddress(userId, editingAddressId, payload)
                : addAddress(userId, payload);
        request
            .then(() => {
                toast.success(
                    editingAddressId !== null ? "Address updated." : "Address added.",
                );
                loadAddresses();
                cancelForm();
            })
            .catch(() => toast.error("Failed to save address."))
            .finally(() => setSaving(false));
    }
    function proceedToPayment() {
        const selected = addresses.find((a) => a.id === selectedAddressId);
        if (!selected) {
            toast.error("Please select a delivery address.");
            return;
        }
        if (deliveryStatus !== "available") {
            toast.error("Delivery is not available for this address.");
            return;
        }
        if (!userId || creatingOrder) return;
        const items = orderSummary.items;
        if (!items.length) {
            toast.error("Your cart is empty.");
            return;
        }
        const addressString = `${selected.addressLine1}, ${selected.addressLine2 ? selected.addressLine2 + ", " : ""
            }${selected.city}, ${selected.state} - ${selected.pincode}`;
        const payload = {
            user_id: userId,
            customer_name: selected.name || customerName,
            customer_email: customerEmail,
            customer_phone: selected.mobile,
            seller_name: "Flybirds Store",
            payment_method: "razorpay",
            shipping_address: addressString,
            billing_address: addressString,
            discount: orderSummary.discountAmount,
            tax: orderSummary.taxAmount,
            items: items.map((i) => ({
                product_id: i.productId,
                product_color_variant_id: i.productColorVariantId,
                product_size_stock_id: i.productSizeStockId,
                quantity: i.qty,
            })),
        };
        setCreatingOrder(true);
        createOrder<any>(payload)
            .then((res) => {
                const orderId = res?.data?.id ?? res?.data?.order_id;
                if (!orderId) {
                    toast.error("Order created but no order ID was returned.");
                    return;
                }
                router.push(`/payment?orderId=${orderId}`);
            })
            .catch(() => toast.error("Failed to create order. Please try again."))
            .finally(() => setCreatingOrder(false));
    }
    if (loadingAddresses) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-main" />
                <h6 className="mt-3">Loading Address...</h6>
            </div>
        );
    }
    return (
        <div className="checkout my-4">
            <Stepper current={1} />
            <div className="checkout-div">
                <div className="checkout-left">
                    {addresses.length > 0 && (
                        <div className="address-list mb-4">
                            <div className="body-head mb-3">
                                <h5 className="mb-0">Select Delivery Address</h5>
                            </div>
                            {addresses.map((address) => (
                                <div
                                    key={address.id}
                                    className={`address-item ${selectedAddressId === address.id ? "selected" : ""
                                        }`}
                                    onClick={() => selectAddress(address.id)}
                                >
                                    <input
                                        type="radio"
                                        id={`address-${address.id}`}
                                        name="address"
                                        checked={selectedAddressId === address.id}
                                        onChange={() => selectAddress(address.id)}
                                    />
                                    <label htmlFor={`address-${address.id}`} className="w-100">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <h4 className="mb-0">{address.label}</h4>
                                            {address.isDefault && (
                                                <span className="badge badge-secondary">Default</span>
                                            )}
                                        </div>
                                        <h5 className="mb-2">{address.name}</h5>
                                        <h6 className="mb-2">Mobile: {address.mobile}</h6>
                                        <h6 className="mb-2">
                                            {address.addressLine1},{" "}
                                            {address.addressLine2 ? address.addressLine2 + ", " : ""}
                                            {address.city}, {address.state} - {address.pincode}.
                                        </h6>
                                        {selectedAddressId === address.id && (
                                            <>
                                                {deliveryStatus === "checking" && (
                                                    <small className="normal-small d-block mb-2">
                                                        <i className="fa-solid fa-spinner fa-spin me-1" />{" "}
                                                        Checking delivery availability...
                                                    </small>
                                                )}
                                                {deliveryStatus === "available" && (
                                                    <small className="normal-small text-success d-block mb-2">
                                                        <i className="fa-solid fa-circle-check me-1" />{" "}
                                                        Delivery available for this address
                                                        {deliveryResult && (
                                                            <>
                                                                {" "}
                                                                (
                                                                {deliveryResult.codAvailable
                                                                    ? "COD"
                                                                    : "No COD"}
                                                                {deliveryResult.prepaidAvailable
                                                                    ? ", Prepaid"
                                                                    : ""}
                                                                )
                                                            </>
                                                        )}
                                                    </small>
                                                )}
                                                {deliveryStatus === "unavailable" && (
                                                    <small className="error-small d-block mb-2">
                                                        <i className="fa-solid fa-circle-xmark me-1" />{" "}
                                                        Delivery not available for this address
                                                    </small>
                                                )}
                                            </>
                                        )}
                                        <div
                                            className="d-flex align-items-center gap-3"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <a
                                                className="d-flex align-items-center column-gap-2"
                                                style={{ cursor: "pointer" }}
                                                onClick={() => startEdit(address)}
                                            >
                                                <i className="fa-solid fa-pencil text-main me-1" /> Edit
                                            </a>
                                            |
                                            <a
                                                className="d-flex align-items-center column-gap-2 text-danger"
                                                style={{ cursor: "pointer" }}
                                                onClick={() => removeAddress(address.id)}
                                            >
                                                <i className="fa-solid fa-trash text-danger me-1" />{" "}
                                                Delete
                                            </a>
                                            {!address.isDefault && (
                                                <>
                                                    |
                                                    <a
                                                        className="d-flex align-items-center column-gap-2"
                                                        style={{ cursor: "pointer" }}
                                                        onClick={() => setDefault(address.id)}
                                                    >
                                                        <i className="fa-solid fa-star me-1 text-warning" />{" "}
                                                        Set as Default
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                    {addresses.length === 0 && (
                        <div className="text-center text-muted py-5">
                            <i className="fa-solid fa-location-dot fa-2x mb-3 text-muted" />
                            <p className="mb-2">Your address is empty.</p>
                        </div>
                    )}
                    <div className="divider mb-4">
                        <div className="divider-line" />
                        <h6 className="mb-0">{showAddressForm ? "Cancel" : "OR"}</h6>
                        <div className="divider-line" />
                    </div>
                    {!showAddressForm && (
                        <div className="mb-3">
                            <button className="login-btn w-100" onClick={toggleForm}>
                                <i className="fa-solid fa-plus me-2" /> Add New Address
                            </button>
                        </div>
                    )}
                    {showAddressForm && (
                        <div className="address-form">
                            <div className="body-head mb-3">
                                <h5 className="mb-0">
                                    {editingAddressId !== null
                                        ? "Edit Address"
                                        : "Add New Address"}
                                </h5>
                            </div>
                            <form
                                className="form row row-gap-3"
                                onSubmit={(e) => e.preventDefault()}
                            >
                                <div className="col-md-6">
                                    <label htmlFor="address-name">
                                        Name <span>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="address-name"
                                        placeholder="Enter Name"
                                        value={form.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                                    />
                                    <small className="error-small">{getError("name")}</small>
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="address-phone">
                                        Mobile Number <span>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="address-phone"
                                        placeholder="Enter Mobile Number"
                                        value={form.mobile}
                                        onChange={(e) => handleChange("mobile", e.target.value)}
                                        onBlur={() => setTouched((t) => ({ ...t, mobile: true }))}
                                    />
                                    <small className="error-small">{getError("mobile")}</small>
                                </div>
                                <div className="col-md-12">
                                    <label htmlFor="address-line1">
                                        Address Line 1 <span>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="address-line1"
                                        placeholder="House no., Building, Street"
                                        value={form.addressLine1}
                                        onChange={(e) =>
                                            handleChange("addressLine1", e.target.value)
                                        }
                                        onBlur={() =>
                                            setTouched((t) => ({ ...t, addressLine1: true }))
                                        }
                                    />
                                    <small className="error-small">
                                        {getError("addressLine1")}
                                    </small>
                                </div>
                                <div className="col-md-12">
                                    <label htmlFor="address-line2">Address Line 2</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="address-line2"
                                        placeholder="Locality, Area (optional)"
                                        value={form.addressLine2}
                                        onChange={(e) =>
                                            handleChange("addressLine2", e.target.value)
                                        }
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label htmlFor="address-city">
                                        City <span>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="address-city"
                                        placeholder="Enter City"
                                        value={form.city}
                                        onChange={(e) => handleChange("city", e.target.value)}
                                        onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                                    />
                                    <small className="error-small">{getError("city")}</small>
                                </div>
                                <div className="col-md-4">
                                    <label htmlFor="address-state">
                                        State <span>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="address-state"
                                        placeholder="Enter State"
                                        value={form.state}
                                        onChange={(e) => handleChange("state", e.target.value)}
                                        onBlur={() => setTouched((t) => ({ ...t, state: true }))}
                                    />
                                    <small className="error-small">{getError("state")}</small>
                                </div>
                                <div className="col-md-4">
                                    <label htmlFor="address-pincode">
                                        Pincode <span>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="address-pincode"
                                        placeholder="6-digit Pincode"
                                        maxLength={6}
                                        value={form.pincode}
                                        onChange={(e) => handleChange("pincode", e.target.value)}
                                        onBlur={() => setTouched((t) => ({ ...t, pincode: true }))}
                                    />
                                    <small className="error-small">{getError("pincode")}</small>
                                    {pincodeChecking && (
                                        <small className="normal-small">
                                            <i className="fa-solid fa-spinner fa-spin me-1" />{" "}
                                            Checking delivery...
                                        </small>
                                    )}
                                    {pincodeStatus === "available" && !pincodeChecking && (
                                        <small className="normal-small text-success">
                                            <i className="fa-solid fa-circle-check me-1" /> Delivery
                                            available for this pincode
                                            {pincodeResult && (
                                                <>
                                                    {" "}
                                                    ({pincodeResult.codAvailable ? "COD" : "No COD"}
                                                    {pincodeResult.prepaidAvailable ? ", Prepaid" : ""})
                                                </>
                                            )}
                                        </small>
                                    )}
                                    {pincodeStatus === "unavailable" && !pincodeChecking && (
                                        <small className="error-small">
                                            <i className="fa-solid fa-circle-xmark me-1" /> Delivery
                                            not available for this pincode
                                        </small>
                                    )}
                                </div>
                                <div className="col-md-12 d-flex align-items-center justify-content-start column-gap-4">
                                    {(["Home", "Work", "Other"] as const).map((type) => (
                                        <div className="form-check" key={type}>
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                id={`type-${type}`}
                                                checked={form.type === type}
                                                onChange={() => handleChange("type", type)}
                                            />
                                            <label className="form-check-label" htmlFor={`type-${type}`}>
                                                {type}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <div className="col-md-12">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="set-default"
                                            checked={form.isDefault}
                                            onChange={(e) =>
                                                handleChange("isDefault", e.target.checked)
                                            }
                                        />
                                        <label className="form-check-label" htmlFor="set-default">
                                            Set as default address
                                        </label>
                                    </div>
                                </div>
                                <div className="col-md-12 d-flex gap-3">
                                    <button
                                        type="button"
                                        className="login-btn flex-grow-1"
                                        disabled={saving || pincodeChecking}
                                        onClick={saveAddress}
                                    >
                                        {saving
                                            ? "Saving..."
                                            : editingAddressId !== null
                                                ? "Update Address"
                                                : "Save Address"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
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
                            <h6 className="mb-0">Tax (GST 18%)</h6>
                            <h5 className="mb-0">₹{orderSummary.taxAmount}</h5>
                        </div>
                        <hr className="my-3" />
                        <div className="summary-item">
                            <h6 className="mb-0 text-danger fw-bold">Total</h6>
                            <h5 className="mb-0 fw-bold">₹{orderSummary.total}</h5>
                        </div>

                        {/* Only show Proceed to Payment when the selected address IS deliverable. */}
                        {deliveryStatus === "available" && (
                            <button
                                className="login-btn w-100"
                                disabled={
                                    selectedAddressId === -1 ||
                                    addresses.length === 0 ||
                                    creatingOrder
                                }
                                onClick={proceedToPayment}
                            >
                                {creatingOrder ? "Placing Order..." : "Proceed to Payment"}
                            </button>
                        )}

                        {/* Selected address is not serviceable: hide payment, prompt to add a new one. */}
                        {deliveryStatus === "unavailable" && (
                            <div className="alert alert-danger text-center mb-0" role="alert">
                                <i className="fa-solid fa-circle-xmark me-1" /> Delivery is not
                                available to this address. Please add a new address to
                                continue.
                            </div>
                        )}

                        {/* Still checking the selected address's pincode. */}
                        {deliveryStatus === "checking" && (
                            <button className="login-btn w-100" disabled>
                                <i className="fa-solid fa-spinner fa-spin me-2" /> Checking
                                delivery...
                            </button>
                        )}

                        {/* No address selected yet / status unknown. */}
                        {deliveryStatus === null && (
                            <button className="login-btn w-100" disabled>
                                Proceed to Payment
                            </button>
                        )}

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
    );
}