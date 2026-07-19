// app/(portal)/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { loginOtp, loginwithEmail } from "@/app/lib/api";

import "./page.css";

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Login() {
    const router = useRouter();

    const [loginMode, setLoginMode] = useState<"otp" | "password">("otp");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    function submit() {
        if (loginMode === "otp") {
            sendOtp();
        } else {
            loginWithPassword();
        }
    }

    async function sendOtp() {
        if (!email.trim()) {
            toast.error("Please enter your email ID");
            return;
        }
        if (!isValidEmail(email.trim())) {
            toast.error("Please enter a valid email ID");
            return;
        }

        setIsLoading(true);
        try {
            const response = await loginOtp<any>({ login_field: email.trim() });

            const otpToken =
                response?.login_otp_token ??
                response?.data?.login_otp_token ??
                response?.result?.login_otp_token;

            if (!otpToken) {
                toast.error("Something went wrong. Please try again.");
                return;
            }

            toast.success("OTP sent successfully!");

            sessionStorage.setItem("otpToken", otpToken);
            sessionStorage.setItem("otpFlow", "login");
            sessionStorage.setItem("registerEmail", email.trim());
            sessionStorage.removeItem("registerName");

            router.push("/otp");
        } catch (err: any) {
            toast.error(err?.error?.error?.message || err?.error?.message || "Failed to send OTP");
        } finally {
            setIsLoading(false);
        }
    }

    async function loginWithPassword() {
        if (!email.trim()) {
            toast.error("Please enter your email ID");
            return;
        }
        if (!isValidEmail(email.trim())) {
            toast.error("Please enter a valid email ID");
            return;
        }
        if (!password.trim()) {
            toast.error("Please enter your password");
            return;
        }

        setIsLoading(true);
        try {
            const response = await loginwithEmail<any>({ email: email.trim(), password });

            if (response?.access_token) localStorage.setItem("authToken", response.access_token);
            if (response?.refresh_token) localStorage.setItem("refreshToken", response.refresh_token);
            if (response?.user_id) localStorage.setItem("userId", response.user_id);
            if (response?.expires_in) {
                const expiresAt = Date.now() + response.expires_in * 1000;
                localStorage.setItem("tokenExpiresAt", String(expiresAt));
            }

            toast.success("Logged in successfully!");
            router.push("/");
        } catch (err: any) {
            toast.error(err?.error?.error?.message || err?.error?.message || "Invalid email or password");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="portal-main">
            <div className="portal-div">
                <div className="portal-left">
                    <img src="/assets/images/Portal/1.png" alt="Portal" />
                    <h1>&quot;Your vibe, your style Login &amp; fly now&quot;</h1>
                </div>

                <div className="portal-right">
                    <img src="/assets/images/Logo-Dark.png" alt="Logo" />
                    <h4>Login to unlock faster checkout and special deals!</h4>

                    <div className="nav nav-tabs profile-nav-pill border-0">
                        <button
                            type="button"
                            className={`nav-link pill-btn pill-btn-left rounded-end-0 border-end-0 ${loginMode === "otp" ? "active" : ""}`}
                            onClick={() => setLoginMode("otp")}
                        >
                            Login with OTP
                        </button>
                        <button
                            type="button"
                            className={`nav-link pill-btn pill-btn-right rounded-start-0 border-start-0 ${loginMode === "password" ? "active" : ""}`}
                            onClick={() => setLoginMode("password")}
                        >
                            Login with Password
                        </button>
                    </div>

                    <div className="w-100">
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="mb-3">
                                <label htmlFor="email">Email ID <span>*</span></label>
                                <input
                                    type="email"
                                    className="form-control"
                                    name="email"
                                    id="email"
                                    placeholder="Enter your Email ID"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            {loginMode === "password" && (
                                <div className="mb-3">
                                    <label htmlFor="password">Password <span>*</span></label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="password"
                                        id="password"
                                        placeholder="Enter your Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="mb-3">
                                <button type="button" className="login-btn w-100" onClick={submit} disabled={isLoading}>
                                    {loginMode === "otp" && <i className="fa-solid fa-envelope me-2"></i>}
                                    {loginMode === "password" && <i className="fa-solid fa-lock me-2"></i>}
                                    {isLoading
                                        ? loginMode === "otp" ? "Sending..." : "Logging in..."
                                        : loginMode === "otp" ? "Send OTP via Email" : "Login"}
                                </button>
                            </div>

                            <div>
                                <h6 className="mb-0">Didn&apos;t have an account? <Link href="/register">Register</Link></h6>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}