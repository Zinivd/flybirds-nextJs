// app/components/profile/address.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getAddresses, addAddress, updateAddress, deleteAddress } from "@/app/lib/api";

import "./address.css";

export interface Address {
    id: number | string;
    label: string;
    name: string;
    mobile: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    type: "Home" | "Work" | "Other";
    isDefault: boolean;
}

interface AddressForm {
    name: string;
    mobile: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    type: "Home" | "Work" | "Other";
    isDefault: boolean;
}

const emptyForm: AddressForm = {
    name: "",
    mobile: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    type: "Home",
    isDefault: false,
};

function mapApiAddress(a: any): Address {
    const label = a.address_type ? a.address_type.charAt(0).toUpperCase() + a.address_type.slice(1) : "Home";
    return {
        id: a.id,
        label,
        name: a.full_name || "",
        mobile: a.phone || "",
        addressLine1: a.address_line_1 || "",
        addressLine2: a.address_line_2 || "",
        city: a.city || "",
        state: a.state || "",
        pincode: a.postal_code || "",
        country: a.country || "",
        type: label as "Home" | "Work" | "Other",
        isDefault: !!a.is_default,
    };
}

function toFormState(address?: Address): AddressForm {
    if (!address) return { ...emptyForm };
    return {
        name: address.name,
        mobile: address.mobile,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country || "India",
        type: address.type,
        isDefault: address.isDefault,
    };
}

function validate(form: AddressForm) {
    const errs: Partial<Record<keyof AddressForm, string>> = {};

    if (!form.name.trim()) errs.name = "Name is required.";
    else if (form.name.trim().length < 2) errs.name = "Name is too short.";

    if (!form.mobile.trim()) errs.mobile = "Phone is required.";
    else if (!/^\+?[0-9\-]{10,15}$/.test(form.mobile.trim())) errs.mobile = "Enter a valid mobile number.";

    if (!form.addressLine1.trim()) errs.addressLine1 = "Address Line 1 is required.";
    if (!form.city.trim()) errs.city = "City is required.";
    if (!form.state.trim()) errs.state = "State is required.";
    if (!form.country.trim()) errs.country = "Country is required.";

    if (!form.pincode.trim()) errs.pincode = "Pincode is required.";
    else if (!/^[0-9]{6}$/.test(form.pincode.trim())) errs.pincode = "Pincode must be 6 digits.";

    return errs;
}

export default function AddressTab() {
    const [selectedAddressId, setSelectedAddressId] = useState<number | string>(-1);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<number | string | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [form, setForm] = useState<AddressForm>({ ...emptyForm });
    const [touched, setTouched] = useState<Partial<Record<keyof AddressForm, boolean>>>({});

    function userId() {
        return localStorage.getItem("userId") || "";
    }

    useEffect(() => {
        loadAddresses();
    }, []);

    async function loadAddresses() {
        const uid = userId();
        if (!uid) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await getAddresses<any>(uid);
            const rawList = res?.data || res || [];
            const mapped = rawList.map(mapApiAddress);
            setAddresses(mapped);
            const defaultAddr = mapped.find((a: Address) => a.isDefault);
            setSelectedAddressId(defaultAddr ? defaultAddr.id : mapped[0]?.id ?? -1);
        } catch {
            // silent, matches Angular original
        } finally {
            setLoading(false);
        }
    }

    function selectAddress(id: number | string) {
        setSelectedAddressId(id);
    }

    async function setDefault(id: number | string) {
        try {
            await updateAddress<any>(userId(), id, { is_default: true });
            await loadAddresses();
            toast.success("Default address updated!");
        } catch {
            toast.error("Could not update default address.");
        }
    }

    function editAddress(address: Address) {
        setEditingAddressId(address.id);
        setForm(toFormState(address));
        setTouched({});
        setShowAddressForm(true);
    }

    async function deleteAddressHandler(id: number | string) {
        try {
            await deleteAddress<any>(userId(), id);
            setAddresses((prev) => {
                const next = prev.filter((a) => a.id !== id);
                if (selectedAddressId === id) {
                    const def = next.find((a) => a.isDefault) || next[0];
                    setSelectedAddressId(def?.id ?? -1);
                }
                return next;
            });
            toast.success("Address deleted successfully!");
        } catch {
            toast.error("Could not delete address.");
        }
    }

    function toggleForm() {
        const next = !showAddressForm;
        setShowAddressForm(next);
        if (next) {
            setEditingAddressId(null);
            setForm({ ...emptyForm });
            setTouched({});
        }
    }

    function cancelForm() {
        setShowAddressForm(false);
        setEditingAddressId(null);
        setForm({ ...emptyForm });
        setTouched({});
    }

    async function saveAddress() {
        const errs = validate(form);
        if (Object.keys(errs).length > 0) {
            setTouched({
                name: true, mobile: true, addressLine1: true,
                city: true, state: true, country: true, pincode: true,
            });
            return;
        }

        const payload = {
            address_type: (form.type || "Home").toLowerCase(),
            full_name: form.name,
            phone: form.mobile,
            address_line_1: form.addressLine1,
            address_line_2: form.addressLine2,
            city: form.city,
            state: form.state,
            postal_code: form.pincode,
            country: form.country,
            is_default: form.isDefault,
        };

        setSaving(true);
        try {
            if (editingAddressId !== null) {
                await updateAddress<any>(userId(), editingAddressId, payload);
                toast.success("Address updated successfully!");
            } else {
                await addAddress<any>(userId(), payload);
                toast.success("Address added successfully!");
            }
            await loadAddresses();
            cancelForm();
        } catch {
            toast.error("Could not save address.");
        } finally {
            setSaving(false);
        }
    }

    const errors = validate(form);
    const isInvalid = (field: keyof AddressForm) => !!(touched[field] && errors[field]);
    const getError = (field: keyof AddressForm) => (touched[field] ? errors[field] || "" : "");

    function markTouched(field: keyof AddressForm) {
        setTouched((t) => ({ ...t, [field]: true }));
    }

    // ---------------- Address list view ----------------
    if (!showAddressForm) {
        return (
            <div>
                <div className="body-head mb-4 d-flex justify-content-between flex-wrap gap-2">
                    <div>
                        <h5 className="mb-2 text-main">Saved Addresses</h5>
                        <h6 className="mb-0">Need to change your address? Add a new one.</h6>
                    </div>
                    <button className="reset-btn" onClick={toggleForm}>
                        <i className="fas fa-plus me-1"></i> Add New Address
                    </button>
                </div>

                {loading && (
                    <div className="text-center py-5">
                        <div className="spinner-border text-main"></div>
                        <h6 className="mt-3">Loading Address...</h6>
                    </div>
                )}

                {!loading && (
                    <div className="address-list">
                        {addresses.length === 0 && (
                            <div className="text-center text-muted py-5">
                                <i className="fa-solid fa-location-dot fa-2x mb-3 text-muted"></i>
                                <p className="mb-2">Your address is empty.</p>
                            </div>
                        )}

                        {addresses.map((address) => (
                            <div
                                className={`address-item ${selectedAddressId === address.id ? "selected" : ""}`}
                                key={address.id}
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
                                        {address.isDefault && <span className="badge badge-secondary">Default</span>}
                                    </div>
                                    <h5 className="mb-2">{address.name}</h5>
                                    <h6 className="mb-2">Mobile: {address.mobile}</h6>
                                    <h6 className="mb-2">
                                        {address.addressLine1}, {address.addressLine2 ? address.addressLine2 + ", " : ""}
                                        {address.city}, {address.state} - {address.pincode}.
                                    </h6>
                                    <div className="d-flex align-items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                        <a
                                            className="d-flex align-items-center column-gap-2"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => editAddress(address)}
                                        >
                                            <i className="fa-solid fa-pencil text-main me-1"></i> Edit
                                        </a>
                                        |
                                        <a
                                            className="d-flex align-items-center column-gap-2 text-danger"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => deleteAddressHandler(address.id)}
                                        >
                                            <i className="fa-solid fa-trash text-danger me-1"></i> Delete
                                        </a>
                                        {!address.isDefault && (
                                            <>
                                                |
                                                <a
                                                    className="d-flex align-items-center column-gap-2"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => setDefault(address.id)}
                                                >
                                                    <i className="fa-solid fa-star me-1 text-warning"></i> Set as Default
                                                </a>
                                            </>
                                        )}
                                    </div>
                                </label>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ---------------- Address form view ----------------
    return (
        <div className="address-form">
            <div className="body-head d-flex justify-content-between flex-wrap gap-2 mb-3">
                <h5 className="mb-0">{editingAddressId !== null ? "Edit Address" : "Add New Address"}</h5>
            </div>

            <form className="form row row-gap-3" onSubmit={(e) => e.preventDefault()}>
                <div className="col-md-6">
                    <label htmlFor="address-name">Name <span>*</span></label>
                    <input
                        type="text"
                        className={`form-control ${isInvalid("name") ? "is-invalid" : ""}`}
                        id="address-name"
                        placeholder="Enter Name"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        onBlur={() => markTouched("name")}
                    />
                    <small className="error-small">{getError("name")}</small>
                </div>

                <div className="col-md-6">
                    <label htmlFor="address-phone">Mobile Number <span>*</span></label>
                    <input
                        type="text"
                        className={`form-control ${isInvalid("mobile") ? "is-invalid" : ""}`}
                        id="address-phone"
                        placeholder="Enter Mobile Number"
                        value={form.mobile}
                        onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                        onBlur={() => markTouched("mobile")}
                    />
                    <small className="error-small">{getError("mobile")}</small>
                </div>

                <div className="col-md-12">
                    <label htmlFor="address-line1">Address Line 1 <span>*</span></label>
                    <input
                        type="text"
                        className={`form-control ${isInvalid("addressLine1") ? "is-invalid" : ""}`}
                        id="address-line1"
                        placeholder="House no., Building, Street"
                        value={form.addressLine1}
                        onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
                        onBlur={() => markTouched("addressLine1")}
                    />
                    <small className="error-small">{getError("addressLine1")}</small>
                </div>

                <div className="col-md-12">
                    <label htmlFor="address-line2">Address Line 2</label>
                    <input
                        type="text"
                        className="form-control"
                        id="address-line2"
                        placeholder="Locality, Area (optional)"
                        value={form.addressLine2}
                        onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))}
                    />
                </div>

                <div className="col-md-4">
                    <label htmlFor="address-city">City <span>*</span></label>
                    <input
                        type="text"
                        className={`form-control ${isInvalid("city") ? "is-invalid" : ""}`}
                        id="address-city"
                        placeholder="Enter City"
                        value={form.city}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                        onBlur={() => markTouched("city")}
                    />
                    <small className="error-small">{getError("city")}</small>
                </div>

                <div className="col-md-4">
                    <label htmlFor="address-state">State <span>*</span></label>
                    <input
                        type="text"
                        className={`form-control ${isInvalid("state") ? "is-invalid" : ""}`}
                        id="address-state"
                        placeholder="Enter State"
                        value={form.state}
                        onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                        onBlur={() => markTouched("state")}
                    />
                    <small className="error-small">{getError("state")}</small>
                </div>

                <div className="col-md-4">
                    <label htmlFor="address-country">Country <span>*</span></label>
                    <input
                        type="text"
                        className={`form-control ${isInvalid("country") ? "is-invalid" : ""}`}
                        id="address-country"
                        placeholder="Country"
                        value={form.country}
                        onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                        onBlur={() => markTouched("country")}
                    />
                    <small className="error-small">{getError("country")}</small>
                </div>

                <div className="col-md-4">
                    <label htmlFor="address-pincode">Pincode <span>*</span></label>
                    <input
                        type="text"
                        className={`form-control ${isInvalid("pincode") ? "is-invalid" : ""}`}
                        id="address-pincode"
                        placeholder="6-digit Pincode"
                        maxLength={6}
                        value={form.pincode}
                        onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                        onBlur={() => markTouched("pincode")}
                    />
                    <small className="error-small">{getError("pincode")}</small>
                </div>

                <div className="col-md-12 d-flex align-items-center justify-content-start column-gap-4">
                    {(["Home", "Work", "Other"] as const).map((type) => (
                        <div className="form-check" key={type}>
                            <input
                                className="form-check-input"
                                type="radio"
                                id={`type-${type}`}
                                value={type}
                                checked={form.type === type}
                                onChange={() => setForm((f) => ({ ...f, type }))}
                            />
                            <label className="form-check-label" htmlFor={`type-${type}`}>{type}</label>
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
                            onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                        />
                        <label className="form-check-label" htmlFor="set-default">Set as default address</label>
                    </div>
                </div>

                <div className="col-md-12 d-flex justify-content-end gap-3">
                    <button type="button" className="form-btn" onClick={saveAddress} disabled={saving}>
                        {saving ? "Saving..." : editingAddressId !== null ? "Update Address" : "Save Address"}
                    </button>
                    <button type="button" className="reset-btn" onClick={cancelForm}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}