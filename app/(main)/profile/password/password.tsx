// app/components/profile/password.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getUserInfo, sendPasswordOtp, verifyPasswordOtp } from "@/app/lib/api";

import "./password.css";

interface FormState {
    email: string;
    newPassword: string;
    confirmPassword: string;
    otp: string;
}

interface Touched {
    newPassword?: boolean;
    confirmPassword?: boolean;
    otp?: boolean;
}

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
const OTP_PATTERN = /^[0-9]{5}$/;

function validateForm(form: FormState) {
    const errs: Record<string, string> = {};
    if (!form.newPassword) errs.newPassword = "New Password is required.";
    else if (form.newPassword.length < 8) errs.newPassword = "Password must be at least 8 characters.";
    else if (!PASSWORD_PATTERN.test(form.newPassword))
        errs.newPassword = "Password must contain an uppercase letter, a number, and a special character.";

    if (!form.confirmPassword) errs.confirmPassword = "Confirm Password is required.";

    if (!form.otp) errs.otp = "OTP is required.";
    else if (!OTP_PATTERN.test(form.otp)) errs.otp = "Enter a valid 5-digit OTP.";

    const mismatch = form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword;

    return { errs, mismatch };
}

export default function PasswordTab() {
    const [activeTab, setActiveTab] = useState(0);
    const [userId, setUserId] = useState("");

    const [form, setForm] = useState<FormState>({ email: "", newPassword: "", confirmPassword: "", otp: "" });
    const [forgotForm, setForgotForm] = useState<FormState>({ email: "", newPassword: "", confirmPassword: "", otp: "" });

    const [touched, setTouched] = useState<Touched>({});
    const [forgotTouched, setForgotTouched] = useState<Touched>({});

    const [otpSent, setOtpSent] = useState(false);
    const [otpSending, setOtpSending] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);

    const [forgotOtpSent, setForgotOtpSent] = useState(false);
    const [forgotOtpSending, setForgotOtpSending] = useState(false);
    const [forgotOtpVerifying, setForgotOtpVerifying] = useState(false);

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
    const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);

    useEffect(() => {
        const id = localStorage.getItem("userId") || "";
        setUserId(id);
        loadUser(id);
    }, []);

    async function loadUser(id: string) {
        if (!id) return;
        try {
            const res = await getUserInfo<any>(id);
            const email = res.data?.email ?? "";
            setForm((f) => ({ ...f, email }));
            setForgotForm((f) => ({ ...f, email }));
        } catch {
            toast.error("Unable to fetch user information");
        }
    }

    const { errs: errors, mismatch: passwordMismatch } = validateForm(form);
    const { errs: forgotErrors, mismatch: forgotPasswordMismatch } = validateForm(forgotForm);

    const isInvalid = (field: keyof Touched) => !!(touched[field] && errors[field]);
    const getError = (field: keyof Touched) => (touched[field] ? errors[field] || "" : "");
    const isForgotInvalid = (field: keyof Touched) => !!(forgotTouched[field] && forgotErrors[field]);
    const getForgotError = (field: keyof Touched) => (forgotTouched[field] ? forgotErrors[field] || "" : "");

    // ---------- Change Password ----------
    async function sendOtp() {
        if (otpSending || otpSent) return;
        setOtpSending(true);
        try {
            await sendPasswordOtp<any>({ login_field: form.email });
            setOtpSent(true);
            toast.success("OTP sent successfully");
        } catch {
            toast.error("Unable to send OTP");
        } finally {
            setOtpSending(false);
        }
    }

    async function verifyOtp() {
        setTouched({ newPassword: true, confirmPassword: true, otp: true });
        const { errs, mismatch } = validateForm(form);
        if (Object.keys(errs).length > 0 || mismatch) return;
        if (otpVerifying) return;

        setOtpVerifying(true);
        try {
            await verifyPasswordOtp<any>({
                email: form.email,
                newPassword: form.newPassword,
                confirmPassword: form.confirmPassword,
                otp: form.otp,
            });
            toast.success("Password changed successfully");
            resetPassword();
        } catch (err: any) {
            toast.error(err?.error?.message || "OTP verification failed");
        } finally {
            setOtpVerifying(false);
        }
    }

    function resetPassword() {
        setForm({ email: form.email, newPassword: "", confirmPassword: "", otp: "" });
        setTouched({});
        setOtpSent(false);
    }

    // ---------- Forgot Password ----------
    async function sendForgotOtp() {
        if (forgotOtpSending || forgotOtpSent) return;
        setForgotOtpSending(true);
        try {
            await sendPasswordOtp<any>({ login_field: forgotForm.email });
            setForgotOtpSent(true);
            toast.success("OTP sent successfully");
        } catch {
            toast.error("Unable to send OTP");
        } finally {
            setForgotOtpSending(false);
        }
    }

    async function verifyForgotOtp() {
        setForgotTouched({ newPassword: true, confirmPassword: true, otp: true });
        const { errs, mismatch } = validateForm(forgotForm);
        if (Object.keys(errs).length > 0 || mismatch) return;
        if (forgotOtpVerifying) return;

        setForgotOtpVerifying(true);
        try {
            await verifyPasswordOtp<any>({
                email: forgotForm.email,
                newPassword: forgotForm.newPassword,
                confirmPassword: forgotForm.confirmPassword,
                otp: forgotForm.otp,
            });
            toast.success("Password reset successfully");
            resetForgotPassword();
        } catch (err: any) {
            toast.error(err?.error?.message || "OTP verification failed");
        } finally {
            setForgotOtpVerifying(false);
        }
    }

    function resetForgotPassword() {
        setForgotForm({ email: forgotForm.email, newPassword: "", confirmPassword: "", otp: "" });
        setForgotTouched({});
        setForgotOtpSent(false);
    }

    return (
        <>
            <ul className="nav nav-tabs border-0 profile-nav-pill mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link pill-btn pill-btn-left rounded-end-0 border-end-0 ${activeTab === 0 ? "active" : ""}`}
                        onClick={() => setActiveTab(0)}
                    >
                        Change Password
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link pill-btn pill-btn-right rounded-start-0 border-start-0 ${activeTab === 1 ? "active" : ""}`}
                        onClick={() => setActiveTab(1)}
                    >
                        Forgot Password
                    </button>
                </li>
            </ul>

            <div className="tab-content">
                {/* Change Password */}
                <div className={`tab-pane ${activeTab === 0 ? "active" : ""}`}>
                    <div className="body-head mb-4">
                        <h5 className="mb-2 text-main">Change Password</h5>
                        <h6 className="mb-0">Enter your email, verify OTP, and set a new password.</h6>
                    </div>

                    <form className="form row row-gap-3" onSubmit={(e) => e.preventDefault()}>
                        <div className="col-md-6">
                            <label>Email</label>
                            <div className="input-group">
                                <input className="form-control" value={form.email} readOnly />
                                <button type="button" className="form-btn" onClick={sendOtp} disabled={otpSent || otpSending}>
                                    {otpSending ? "Sending..." : otpSent ? "OTP Sent" : "Send OTP"}
                                </button>
                            </div>
                        </div>

                        {otpSent && (
                            <>
                                <div className="col-md-6">
                                    <label>New Password</label>
                                    <div className="input-repeat-double-flex">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            className="form-control border-0"
                                            value={form.newPassword}
                                            onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                                            onBlur={() => setTouched((t) => ({ ...t, newPassword: true }))}
                                        />
                                        <label onClick={() => setShowNewPassword(!showNewPassword)} className="text-center mb-0">
                                            <i className={`fas ${showNewPassword ? "fa-eye" : "fa-eye-slash"}`}></i>
                                        </label>
                                    </div>
                                    {isInvalid("newPassword") && <small className="error-small">{getError("newPassword")}</small>}
                                </div>

                                <div className="col-md-6">
                                    <label>Confirm Password</label>
                                    <div className="input-repeat-double-flex">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="form-control border-0"
                                            value={form.confirmPassword}
                                            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                                            onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                                        />
                                        <label onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-center mb-0">
                                            <i className={`fas ${showConfirmPassword ? "fa-eye" : "fa-eye-slash"}`}></i>
                                        </label>
                                    </div>
                                    {isInvalid("confirmPassword") && <small className="error-small">{getError("confirmPassword")}</small>}
                                    {passwordMismatch && touched.confirmPassword && <small className="error-small">Passwords do not match.</small>}
                                </div>

                                <div className="col-md-6">
                                    <label>OTP</label>
                                    <input
                                        className="form-control"
                                        maxLength={5}
                                        value={form.otp}
                                        onChange={(e) => setForm((f) => ({ ...f, otp: e.target.value }))}
                                        onBlur={() => setTouched((t) => ({ ...t, otp: true }))}
                                    />
                                    {isInvalid("otp") && <small className="error-small">{getError("otp")}</small>}
                                </div>

                                <div className="col-md-12 d-flex justify-content-end gap-3">
                                    <button className="form-btn" type="button" onClick={verifyOtp} disabled={otpVerifying}>
                                        {otpVerifying ? "Verifying..." : "Verify OTP"}
                                    </button>
                                    <button className="reset-btn" type="button" onClick={resetPassword}>Reset</button>
                                </div>
                            </>
                        )}
                    </form>
                </div>

                {/* Forgot Password */}
                <div className={`tab-pane ${activeTab === 1 ? "active" : ""}`}>
                    <div className="body-head mb-4">
                        <h5 className="mb-2 text-main">Forgot Password</h5>
                        <h6 className="mb-0">Enter your email, verify OTP, and set a new password.</h6>
                    </div>

                    <form className="form row row-gap-3" onSubmit={(e) => e.preventDefault()}>
                        <div className="col-md-6">
                            <label>Email</label>
                            <div className="input-group">
                                <input className="form-control" value={forgotForm.email} readOnly />
                                <button
                                    type="button"
                                    className="form-btn"
                                    onClick={sendForgotOtp}
                                    disabled={forgotOtpSent || forgotOtpSending}
                                >
                                    {forgotOtpSending ? "Sending..." : forgotOtpSent ? "OTP Sent" : "Send OTP"}
                                </button>
                            </div>
                        </div>

                        {forgotOtpSent && (
                            <>
                                <div className="col-md-6">
                                    <label>New Password</label>
                                    <div className="input-repeat-double-flex">
                                        <input
                                            type={showForgotNewPassword ? "text" : "password"}
                                            className="form-control border-0"
                                            value={forgotForm.newPassword}
                                            onChange={(e) => setForgotForm((f) => ({ ...f, newPassword: e.target.value }))}
                                            onBlur={() => setForgotTouched((t) => ({ ...t, newPassword: true }))}
                                        />
                                        <label onClick={() => setShowForgotNewPassword(!showForgotNewPassword)} className="text-center mb-0">
                                            <i className={`fas ${showForgotNewPassword ? "fa-eye" : "fa-eye-slash"}`}></i>
                                        </label>
                                    </div>
                                    {isForgotInvalid("newPassword") && <small className="error-small">{getForgotError("newPassword")}</small>}
                                </div>

                                <div className="col-md-6">
                                    <label>Confirm Password</label>
                                    <div className="input-repeat-double-flex">
                                        <input
                                            type={showForgotConfirmPassword ? "text" : "password"}
                                            className="form-control border-0"
                                            value={forgotForm.confirmPassword}
                                            onChange={(e) => setForgotForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                                            onBlur={() => setForgotTouched((t) => ({ ...t, confirmPassword: true }))}
                                        />
                                        <label onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)} className="text-center mb-0">
                                            <i className={`fas ${showForgotConfirmPassword ? "fa-eye" : "fa-eye-slash"}`}></i>
                                        </label>
                                    </div>
                                    {isForgotInvalid("confirmPassword") && <small className="error-small">{getForgotError("confirmPassword")}</small>}
                                    {forgotPasswordMismatch && forgotTouched.confirmPassword && (
                                        <small className="error-small">Passwords do not match.</small>
                                    )}
                                </div>

                                <div className="col-md-6">
                                    <label>OTP</label>
                                    <input
                                        className="form-control"
                                        maxLength={5}
                                        value={forgotForm.otp}
                                        onChange={(e) => setForgotForm((f) => ({ ...f, otp: e.target.value }))}
                                        onBlur={() => setForgotTouched((t) => ({ ...t, otp: true }))}
                                    />
                                    {isForgotInvalid("otp") && <small className="error-small">{getForgotError("otp")}</small>}
                                </div>

                                <div className="col-md-12 d-flex justify-content-end gap-3">
                                    <button className="form-btn" type="button" onClick={verifyForgotOtp} disabled={forgotOtpVerifying}>
                                        {forgotOtpVerifying ? "Verifying..." : "Verify OTP"}
                                    </button>
                                    <button className="reset-btn" type="button" onClick={resetForgotPassword}>Reset</button>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}