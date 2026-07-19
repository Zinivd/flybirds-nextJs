"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import "./navbar.css"

export default function Navbar() {
    const pathname = usePathname();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem("authToken"));
    }, []);

    const isActive = (href: string, exact = false) =>
        exact ? pathname === href : pathname.startsWith(href);

    const navLinks = [
        { label: "Home", href: "/", exact: true },
        { label: "Womens", href: "/womens" },
        { label: "Kids", href: "/kids" },
        { label: "New Arrivals", href: "/new-arrivals" },
    ];

    return (
        <>
            <div className="free-shipping">
                <h6 className="mb-0">Free Shipping on all orders above Rs. 599</h6>
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
                            {navLinks.map((item) => (
                                <li className="nav-item" key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`nav-link ${isActive(item.href, item.exact) ? "active" : ""}`}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
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
                            {navLinks.map((item) => (
                                <li className="nav-item" key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`nav-link ${isActive(item.href, item.exact) ? "active" : ""}`}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
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