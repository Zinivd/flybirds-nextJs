// app/(portal)/otp/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { loginOtp, loginOtpVerify, register, verifyOtp } from "@/app/lib/api";

import "./page.css";

type OtpFlow = "register" | "login";

export default function Otp() {
    const router = useRouter();

    const [countdown, setCountdown] = useState(30);
    const [showResendButton, setShowResendButton] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    const flowRef = useRef<OtpFlow>("register");
    const otpTokenRef = useRef("");
    const emailRef = useRef("");
    const nameRef = useRef("");

    useEffect(() => {
        const flow = (sessionStorage.getItem("otpFlow") || "register") as OtpFlow;
        const otpToken = sessionStorage.getItem("otpToken") || "";
        const email = sessionStorage.getItem("registerEmail") || "";
        const name = sessionStorage.getItem("registerName") || "";

        flowRef.current = flow;
        otpTokenRef.current = otpToken;
        emailRef.current = email;
        nameRef.current = name;

        if (!otpToken) {
            toast.error("Session expired. Please try again.");
            router.push(flow === "login" ? "/login" : "/register");
            return;
        }

        startTimer();
        return () => stopTimer();
    }, []);

    function startTimer() {
        setCountdown(30);
        setShowResendButton(false);
        stopTimer();
        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev > 0) return prev - 1;
                stopTimer();
                setShowResendButton(true);
                return 0;
            });
        }, 1000);
    }

    function stopTimer() {
        if (timerRef.current) clearInterval(timerRef.current);
    }

    function focusInput(index: number) {
        inputsRef.current[index]?.focus();
    }

    function onInput(e: React.FormEvent<HTMLInputElement>, index: number) {
        const input = e.currentTarget;
        input.value = input.value.replace(/[^0-9]/g, "");
        if (input.value.length === 1 && index < 4) {
            focusInput(index + 1);
        }
    }

    function onKeydown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
        const input = e.currentTarget;
        if (e.key === "Backspace") {
            if (input.value === "" && index > 0) {
                const prevInput = inputsRef.current[index - 1];
                if (prevInput) prevInput.value = "";
                focusInput(index - 1);
            }
        } else if (e.key === "ArrowLeft" && index > 0) {
            focusInput(index - 1);
        } else if (e.key === "ArrowRight" && index < 4) {
            focusInput(index + 1);
        }
    }

    function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text");
        const digits = pasted.replace(/[^0-9]/g, "").slice(0, 5).split("");
        digits.forEach((digit, i) => {
            const el = inputsRef.current[i];
            if (el) el.value = digit;
        });
        focusInput(Math.min(digits.length, 4));
    }

    function getOtpValue() {
        return inputsRef.current.map((el) => el?.value ?? "").join("");
    }

    function clearOtpSession() {
        sessionStorage.removeItem("otpToken");
        sessionStorage.removeItem("otpFlow");
        sessionStorage.removeItem("registerEmail");
        sessionStorage.removeItem("registerName");
    }

    function handleVerifySuccess(response: any) {
        setIsVerifying(false);

        if (response?.access_token) localStorage.setItem("authToken", response.access_token);
        if (response?.refresh_token) localStorage.setItem("refreshToken", response.refresh_token);
        if (response?.user_id) localStorage.setItem("userId", response.user_id);
        if (response?.expires_in) {
            const expiresAt = Date.now() + response.expires_in * 1000;
            localStorage.setItem("tokenExpiresAt", String(expiresAt));
        }

        clearOtpSession();
        toast.success("OTP verified successfully!");
        router.push("/");
    }

    function handleVerifyError(err: any) {
        setIsVerifying(false);
        toast.error(err?.error?.error?.message || err?.error?.message || "Invalid OTP");
    }

    async function handleVerifyOtp() {
        const otp = getOtpValue();
        if (otp.length < 5) {
            toast.warning("Please enter all 5 digits.");
            return;
        }

        setIsVerifying(true);
        try {
            const response =
                flowRef.current === "login"
                    ? await loginOtpVerify<any>({ login_otp_token: otpTokenRef.current, otp_code: otp })
                    : await verifyOtp<any>({ otp_token: otpTokenRef.current, otp_code: otp });
            handleVerifySuccess(response);
        } catch (err) {
            handleVerifyError(err);
        }
    }

    async function handleResendOtp() {
        if (!emailRef.current) {
            toast.error("Missing details. Please try again.");
            router.push(flowRef.current === "login" ? "/login" : "/register");
            return;
        }

        setIsResending(true);

        if (flowRef.current === "login") {
            try {
                const response = await loginOtp<any>({ login_field: emailRef.current });
                const otpToken =
                    response?.login_otp_token ??
                    response?.data?.login_otp_token ??
                    response?.result?.login_otp_token;

                if (!otpToken) {
                    toast.error("Something went wrong. Please try again.");
                    return;
                }

                otpTokenRef.current = otpToken;
                sessionStorage.setItem("otpToken", otpToken);

                inputsRef.current.forEach((el) => { if (el) el.value = ""; });
                focusInput(0);
                toast.success("OTP resent successfully!");
                startTimer();
            } catch (err: any) {
                toast.error(err?.error?.error?.message || err?.error?.message || "Failed to resend OTP");
            } finally {
                setIsResending(false);
            }
            return;
        }

        // register flow
        if (!nameRef.current) {
            toast.error("Missing registration details. Please register again.");
            router.push("/register");
            setIsResending(false);
            return;
        }

        try {
            const response = await register<any>({ name: nameRef.current, email: emailRef.current });
            const otpToken =
                response?.otp_token ?? response?.data?.otp_token ?? response?.result?.otp_token;

            if (!otpToken) {
                toast.error("Something went wrong. Please try again.");
                return;
            }

            otpTokenRef.current = otpToken;
            sessionStorage.setItem("otpToken", otpToken);

            inputsRef.current.forEach((el) => { if (el) el.value = ""; });
            focusInput(0);
            toast.success("OTP resent successfully!");
            startTimer();
        } catch (err: any) {
            toast.error(err?.error?.error?.message || err?.error?.message || "Failed to resend OTP");
        } finally {
            setIsResending(false);
        }
    }

    const formattedTime = `00:${String(countdown).padStart(2, "0")}`;

    return (
        <div className="portal-main">
            <div className="portal-div">
                <div className="portal-left">
                    <img src="/assets/images/Portal/1.png" alt="Portal" />
                    <h1>&quot;Your vibe, your style Login &amp; fly now&quot;</h1>
                </div>

                <div className="portal-right">
                    <img src="/assets/images/Logo-Dark.png" alt="Logo" />
                    <div>
                        <h4 className="mb-3">Enter the 5-digit OTP</h4>
                        <h6 className="mb-0">We have sent you a 5-digit OTP on your email</h6>
                    </div>

                    <div className="w-100">
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="mb-4 otp-container">
                                {[0, 1, 2, 3, 4].map((index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { inputsRef.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        className="form-control otp-input"
                                        onInput={(e) => onInput(e, index)}
                                        onKeyDown={(e) => onKeydown(e, index)}
                                        onPaste={index === 0 ? onPaste : undefined}
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>

                            {!showResendButton && (
                                <div>
                                    <button type="button" className="login-btn w-100" onClick={handleVerifyOtp} disabled={isVerifying}>
                                        {isVerifying ? "Verifying..." : "Verify & Continue"}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    {!showResendButton && (
                        <div>
                            <h6 className="mb-0">Didn&apos;t receive it? Resend in {formattedTime}</h6>
                        </div>
                    )}

                    {showResendButton && (
                        <button
                            type="button"
                            className="login-resend-btn w-100"
                            onClick={handleResendOtp}
                            disabled={isResending}
                        >
                            {isResending ? "Resending..." : "Resend OTP"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}