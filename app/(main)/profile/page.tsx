// app/(main)/profile/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import Info from "@/app/(main)/profile/info/info";
import PasswordTab from "@/app/(main)/profile/password/password";
import Orders from "@/app/(main)/profile/orders/orders";
import Wishlist from "@/app/(main)/profile/wishlist/wishlist";
import Address from "@/app/(main)/profile/address/address";

import "./page.css";

function ProfileContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [activeTab, setActiveTabState] = useState(0);

    useEffect(() => {
        const tab = Number(searchParams.get("tab"));
        if (!isNaN(tab) && tab >= 0 && tab <= 5) {
            setActiveTabState(tab);
        }
    }, [searchParams]);

    function setActiveTab(index: number) {
        setActiveTabState(index);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", String(index));
        router.replace(`/profile?${params.toString()}`);
    }

    function signOut() {
        localStorage.clear();
        sessionStorage.clear();
        toast.success("You have been signed out successfully!");
        router.push("/");
    }

    return (
        <div className="profile my-4">
            <div className="body-head mb-4">
                <h6 className="d-flex align-items-center column-gap-2 mb-0">
                    <Link href="/">
                        Home <i className="fas fa-chevron-right ps-1"></i>
                    </Link>
                    <a className="active">Profile</a>
                </h6>
            </div>

            <div className="profile-div">
                <div className="profile-left">
                    <div className="body-head mb-4">
                        <h4 className="mb-0">My Account</h4>
                    </div>

                    <ul className="nav nav-tabs row-gap-3 border-0 p-0 m-0 profile-tabs">
                        {[
                            { icon: "fa-user", label: "Personal Information" },
                            { icon: "fa-lock", label: "Change Password" },
                            { icon: "fa-clock-rotate-left", label: "Order History" },
                            { icon: "fa-heart", label: "Wishlist" },
                            { icon: "fa-location-dot", label: "Saved Addresses" },
                            { icon: "fa-right-from-bracket", label: "Sign Out" },
                        ].map((tab, i) => (
                            <li className="nav-item" key={i}>
                                <button
                                    className={`nav-link profile-btn ${activeTab === i ? "active" : ""}`}
                                    onClick={() => setActiveTab(i)}
                                >
                                    <i className={`fas ${tab.icon} me-1`}></i> {tab.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="profile-right">
                    <div className="tab-content">
                        <div className={`tab-pane ${activeTab === 0 ? "active" : ""}`}>
                            <Info />
                        </div>

                        <div className={`tab-pane ${activeTab === 1 ? "active" : ""}`}>
                            <PasswordTab />
                        </div>

                        <div className={`tab-pane ${activeTab === 2 ? "active" : ""}`}>
                            <Orders />
                        </div>

                        <div className={`tab-pane ${activeTab === 3 ? "active" : ""}`}>
                            <Wishlist />
                        </div>

                        <div className={`tab-pane ${activeTab === 4 ? "active" : ""}`}>
                            <Address />
                        </div>

                        <div className={`tab-pane ${activeTab === 5 ? "active" : ""}`}>
                            <div className="body-head mb-4">
                                <h5 className="mb-0 text-main">Sign Out</h5>
                            </div>
                            <div className="form">
                                <label>Are you sure you want to sign out of your account?</label>
                            </div>
                            <div className="d-flex gap-3 mt-4">
                                <button className="login-btn" onClick={signOut}>Yes, Sign Out</button>
                                <button className="reset-btn" onClick={() => setActiveTab(0)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Profile() {
    // useSearchParams() requires a Suspense boundary in Next.js
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-main"></div></div>}>
            <ProfileContent />
        </Suspense>
    );
}