// app/(portal)/register/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { register } from "@/app/lib/api";
import "./page.css";

function isValidPhone(phone: string) {
    return /^[0-9]{10}$/.test(phone);
}

export default function Register() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function sendOtp() {
        if (!fullName.trim()) {
            toast.error("Please enter your full name");
            return;
        }
        if (!phone.trim()) {
            toast.error("Please enter your phone number");
            return;
        }
        if (!isValidPhone(phone.trim())) {
            toast.error("Please enter a valid 10-digit phone number");
            return;
        }

        setIsLoading(true);
        try {
            const response = await register<any>({ name: fullName.trim(), phone: phone.trim() });
            const otpToken =
                response?.otp_token ?? response?.data?.otp_token ?? response?.result?.otp_token;

            if (!otpToken) {
                toast.error("Something went wrong. Please try again.");
                return;
            }

            toast.success("OTP sent successfully!");
            sessionStorage.setItem("otpToken", otpToken);
            sessionStorage.setItem("otpFlow", "register");
            sessionStorage.setItem("registerPhone", phone.trim());
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
                                <label htmlFor="phone">Phone Number <span>*</span></label>
                                <input
                                    type="tel"
                                    className="form-control"
                                    name="phone"
                                    id="phone"
                                    placeholder="Enter your Phone Number"
                                    value={phone}
                                    maxLength={10}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                                />
                            </div>
                            <div className="mb-3">
                                <button type="button" className="login-btn w-100" onClick={sendOtp} disabled={isLoading}>
                                    <i className="fa-brands fa-whatsapp me-2"></i>
                                    {isLoading ? "Sending..." : "Send OTP via WhatsApp"}
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