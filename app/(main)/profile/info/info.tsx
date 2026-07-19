// app/components/profile/info.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getUserInfo, updateProfile } from "@/app/lib/api";

interface Errors {
    fullName?: string;
    email?: string;
}

export default function Info() {
    const [userId, setUserId] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [touched, setTouched] = useState<{ fullName?: boolean; email?: boolean }>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const id = localStorage.getItem("userId") || "";
        setUserId(id);
        if (id) loadUserInfo(id);
        else toast.error("User ID not found");
    }, []);

    async function loadUserInfo(id: string) {
        setIsLoading(true);
        try {
            const res = await getUserInfo<any>(id);
            const user = res.data || res.user || res;
            setFullName(user.name || "");
            setEmail(user.email || "");
        } catch (err) {
            toast.error("Unable to fetch profile");
        } finally {
            setIsLoading(false);
        }
    }

    function validate(): Errors {
        const errs: Errors = {};
        if (!fullName.trim()) errs.fullName = "Full Name is required.";
        else if (fullName.trim().length < 2) errs.fullName = "Full Name is too short.";

        if (!email.trim()) errs.email = "Email ID is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Enter a valid email address.";

        return errs;
    }

    const errors = validate();
    const isInvalid = (field: keyof Errors) => !!(touched[field] && errors[field]);
    const getError = (field: keyof Errors) => (touched[field] ? errors[field] || "" : "");

    async function saveInfo() {
        setTouched({ fullName: true, email: true });
        if (Object.keys(validate()).length > 0) return;

        try {
            await updateProfile<any>(userId, { name: fullName });
            toast.success("Profile updated successfully");
            loadUserInfo(userId);
        } catch (err) {
            toast.error("Profile update failed");
        }
    }

    function resetInfo() {
        setTouched({});
        loadUserInfo(userId);
    }

    return (
        <div>
            <div className="body-head mb-3">
                <h5 className="mb-2 text-main">Personal Information</h5>
                <h6 className="mb-0">Your Contact Info Helps us personalize your shopping experience.</h6>
            </div>

            <form className="form row row-gap-3" onSubmit={(e) => e.preventDefault()}>
                <div className="col-md-6">
                    <label htmlFor="full-name">Full Name <span>*</span></label>
                    <input
                        type="text"
                        className={`form-control ${isInvalid("fullName") ? "is-invalid" : ""}`}
                        id="full-name"
                        placeholder="Enter Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                    />
                    {isInvalid("fullName") && <small className="error-small">{getError("fullName")}</small>}
                </div>

                <div className="col-md-6">
                    <label htmlFor="email">Email ID <span>*</span></label>
                    <input
                        type="email"
                        className={`form-control ${isInvalid("email") ? "is-invalid" : ""}`}
                        id="email"
                        placeholder="Enter Email ID"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    />
                    {isInvalid("email") && <small className="error-small">{getError("email")}</small>}
                </div>

                <div className="col-md-12 d-flex justify-content-end gap-3">
                    <button className="form-btn" type="button" onClick={saveInfo}>Save Changes</button>
                    <button className="reset-btn" type="button" onClick={resetInfo}>Reset</button>
                </div>
            </form>
        </div>
    );
}