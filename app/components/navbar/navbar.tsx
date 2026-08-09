"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { getCategoryList } from "@/app/lib/api";
import { CategoryItem } from "@/app/types/shop.models";

import "./navbar.css"

const CATEGORY_NAV_MAP: Record<string, string> = {
    "shimmer": "shimmer",
    "Saree shapper": "Saree shapper",
    "Ankle leggings": "Ankle leggings",
};

export default function Navbar() {
    const pathname = usePathname();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [categories, setCategories] = useState<CategoryItem[]>([]);

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem("authToken"));
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await getCategoryList<any>();
                if (!cancelled) setCategories(res?.data || []);
            } catch (err) {
                console.error("Navbar: error fetching categories:", err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const isActive = (href: string, exact = false) =>
        exact ? pathname === href : pathname.startsWith(href);

    // Builds the same href shape used by the category grid: /all-products/{name}/{id}
    const getCategoryHref = (label: string): string | null => {
        const targetName = CATEGORY_NAV_MAP[label];
        if (!targetName) return null;
        const match = categories.find(
            (c) => c.name?.toLowerCase() === targetName.toLowerCase()
        );
        return match ? `/all-products/${match.name}/${match.id}` : null;
    };

    const navLinks = [
        { label: "Home", href: "/", exact: true },
        { label: "Shimmer"  , href: getCategoryHref("shimmer") },
        { label: "Saree Shaper", href: getCategoryHref("Saree shapper") }, 
        { label: "Ankle", href: getCategoryHref("Ankle leggings") },
    ];

    //  href:"/all-products/shimmer/3"
    //  href:"/all-products/Saree shapper/4"
    // href:"/all-products/Ankle leggings/1"

    const renderNavItem = (item: (typeof navLinks)[number]) => {
        // "Home" keeps its static href/exact match behavior.
        if (item.href) {
            return (
                <li className="nav-item" key={item.href}>
                    <Link
                        href={item.href}
                        className={`nav-link ${isActive(item.href, item.exact) ? "active" : ""}`}
                    >
                        {item.label}
                    </Link>
                </li>
            );
        }

        const href = getCategoryHref(item.label);

        // Categories haven't loaded yet, or no match was found — render a
        // disabled placeholder instead of a broken/guessed link.
        if (!href) {
            return (
                <li className="nav-item" key={item.label}>
                    <span className="nav-link disabled" aria-disabled="true">
                        {item.label}
                    </span>
                </li>
            );
        }

        return (
            <li className="nav-item" key={item.label}>
                <Link href={href} className={`nav-link ${isActive(href) ? "active" : ""}`}>
                    {item.label}
                </Link>
            </li>
        );
    };

    return (
        <>
            <div className="free-shipping">
                <h6 className="mb-0">Free Shipping on all orders above Rs. 499</h6>
            </div>

            <nav className="navbar navbar-expand-lg">
                <div className="container-fluid">
                    {/* Responsive Navbar */}
                    <div className="responsive-div">
                        <div className="responsive-button">
                            <div className="logo-div d-flex align-items-center column-gap-2">
                                <Link href="/">
                                    <img src="/assets/images/Logo-Dark.png" height={50} alt="Logo" />
                                </Link>
                            </div>
                            <div className="icons-div d-lg-none align-items-center">
                                <Link href="/"><i className="bx bx-search"></i></Link>
                                <Link
                                    href={{ pathname: "/profile", query: { tab: 3 } }}
                                    className={`nav-link ${isActive("/profile") ? "active" : ""}`}
                                >
                                    <i className="bx bx-heart"></i>
                                </Link>
                                <Link href="/cart" className={`nav-link ${isActive("/cart") ? "active" : ""}`}>
                                    <i className="bx bx-shopping-bag"></i>
                                </Link>
                                <Link href="/profile" className={`nav-link ${isActive("/profile") ? "active" : ""}`}>
                                    <i className="bx bx-user"></i>
                                </Link>
                            </div>
                        </div>

                        <ul className="navbar-nav flex-row align-items-center justify-content-between mt-3 response-nav-content">
                            {navLinks.map(renderNavItem)}
                        </ul>
                    </div>

                    {/* Web Navbar */}
                    <div className="navbar-collapse d-lg-flex justify-content-evenly align-items-center collapse" id="navbarcontent">
                        <div className="navbar-brand col-lg-1 me-0">
                            <Link href="/">
                                <img src="/assets/images/Logo-Dark.png" height={55} alt="Logo" />
                            </Link>
                        </div>

                        <ul className="navbar-nav col-lg-5 align-items-lg-center justify-content-lg-evenly navbarNav">
                            {navLinks.map(renderNavItem)}
                        </ul>

                        <ul className="navbar-nav col-lg-3 mb-0">
                            <li className="search-bar">
                                <i className="bx bx-search text-center"></i>
                                <input type="text" className="form-control border-0" name="search" id="search" placeholder="Search" />
                            </li>
                        </ul>

                        <ul className="navbar-nav col-lg-3 d-flex align-items-center flex-row icon-end">
                            <li className="nav-item">
                                <Link
                                    href={{ pathname: "/profile", query: { tab: 3 } }}
                                    className={`nav-link nav-icon-btn ${isActive("/profile") ? "active" : ""}`}
                                    title="Wishlist"
                                >
                                    <i className="bx bx-heart"></i>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/cart" className={`nav-link nav-icon-btn ${isActive("/cart") ? "active" : ""}`} title="Cart">
                                    <i className="bx bx-shopping-bag"></i>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/profile" className={`nav-link nav-icon-btn ${isActive("/profile") ? "active" : ""}`} title="Profile">
                                    <i className="bx bx-user"></i>
                                </Link>
                            </li>
                            {!isLoggedIn && (
                                <li className="nav-item" id="cart">
                                    <Link href="/login">
                                        <button type="button" className="navbar-btn">Sign In</button>
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </nav>
        </>
    );
}