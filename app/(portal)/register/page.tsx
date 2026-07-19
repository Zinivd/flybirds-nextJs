// app/(portal)/register/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { register } from "@/app/lib/api";

import "./page.css";

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Register() {
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function sendOtp() {
        if (!fullName.trim()) {
            toast.error("Please enter your full name");
            return;
        }
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
            const response = await register<any>({ name: fullName.trim(), email: email.trim() });

            const otpToken =
                response?.otp_token ?? response?.data?.otp_token ?? response?.result?.otp_token;

            if (!otpToken) {
                toast.error("Something went wrong. Please try again.");
                return;
            }

            toast.success("OTP sent successfully!");

            sessionStorage.setItem("otpToken", otpToken);
            sessionStorage.setItem("otpFlow", "register");
            sessionStorage.setItem("registerEmail", email.trim());
            sessionStorage.setItem("registerName", fullName.trim());

            router.push("/otp");
        } catch (err: any) {
            toast.error(err?.error?.error?.message || err?.error?.message || "Failed to send OTP");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="portal-main">
            <div className="portal-div">
                <div className="portal-left">
                    <img src="/assets/images/Portal/1.png" alt="Portal" />
                    <h1>&quot;Your vibe, your style Register &amp; fly now&quot;</h1>
                </div>

                <div className="portal-right">
                    <img src="/assets/images/Logo-Dark.png" alt="Logo" />
                    <h4>Register to unlock faster checkout and special deals!</h4>

                    <div className="w-100">
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="mb-3">
                                <label htmlFor="name">Full Name <span>*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="name"
                                    id="name"
                                    placeholder="Enter your Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>

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

                            <div className="mb-3">
                                <button type="button" className="login-btn w-100" onClick={sendOtp} disabled={isLoading}>
                                    <i className="fa-solid fa-envelope me-2"></i>
                                    {isLoading ? "Sending..." : "Send OTP via Email"}
                                </button>
                            </div>

                            <div>
                                <h6 className="mb-0">Already have an account? <Link href="/login">Login</Link></h6>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}