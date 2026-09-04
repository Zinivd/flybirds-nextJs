"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getCartWishlistSummary, getCategoryList, getProducts } from "@/app/lib/api";
import { CategoryItem } from "@/app/types/shop.models";
import "./navbar.css";

// Static promo images shown in the mega menu — no category lookup,
// no click-through, just the picture with its name above it.
const MEGA_MENU_PROMOS: { image: string; name: string }[] = [
    { image: "/assets/images/Explore/Ankle.png", name: "Ankle Leggings" },
    { image: "/assets/images/Explore/Saree.png", name: "Saree Shaper" },
    { image: "/assets/images/Explore/Shimmer.png", name: "Shimmer Leggings" },
];

interface SearchProduct {
    id: number;
    name: string;
    tags: string;
    brand: string;
    effective_price: number;
    image: string;
}

interface CartWishlistSummary {
    status: string;
    data: {
        cart_count: number;
        has_wishlist: boolean;
    };
}

export default function Navbar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [categories, setCategories] = useState<CategoryItem[]>([]);

    // ---------- Search ----------
    const [allProducts, setAllProducts] = useState<SearchProduct[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const searchWrapRef = useRef<HTMLLIElement>(null);
    const mobileSearchWrapRef = useRef<HTMLDivElement>(null);

    const [cartWishlistSummary, setCartWishlistSummary] = useState<CartWishlistSummary | null>(null);

    // ---------- Mega menu (opens when hovering/tapping "Woman") ----------
    const [megaMenuOpen, setMegaMenuOpen] = useState(false);
    const megaMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    function openMegaMenu() {
        if (megaMenuCloseTimer.current) {
            clearTimeout(megaMenuCloseTimer.current);
            megaMenuCloseTimer.current = null;
        }
        setMegaMenuOpen(true);
    }

    function scheduleCloseMegaMenu() {
        // Small delay so moving the mouse from "Woman" down into the
        // panel itself doesn't cause it to flicker shut.
        megaMenuCloseTimer.current = setTimeout(() => setMegaMenuOpen(false), 150);
    }

    // Tap-to-toggle for touch devices, where there's no hover.
    function toggleMegaMenu(e: React.MouseEvent) {
        e.preventDefault();
        setMegaMenuOpen((v) => !v);
    }

    useEffect(() => {
        return () => {
            if (megaMenuCloseTimer.current) clearTimeout(megaMenuCloseTimer.current);
        };
    }, []);

    useEffect(() => {
        setIsLoggedIn(isAuthenticated());

        const userId = localStorage.getItem("userId");
        if (!userId) return; // not logged in — nothing to summarize yet

        let cancelled = false;
        (async () => {
            try {
                const res = await getCartWishlistSummary<any>(userId);
                if (cancelled) return;
                console.log("cart-wishlist-summary response:", res);
                setCartWishlistSummary(res);
            } catch (err) {
                console.error("Navbar: error fetching cart-wishlist summary:", err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Central auth check — used everywhere we need to gate a click.
    function isAuthenticated() {
        const authToken = localStorage.getItem("authToken");
        const userId = localStorage.getItem("userId");
        return !!(authToken && userId);
    }

    // Guards any protected nav link (profile, wishlist, cart).
    // If not logged in, redirect to /login instead of the intended page.
    function guardedNavigate(e: React.MouseEvent, href: string) {
        e.preventDefault();
        if (!isAuthenticated()) {
            router.push("/login");
            return;
        }
        router.push(href);
    }

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

    // Load all products once, up front, so search is instant on every keystroke.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await getProducts<any>({});
                if (cancelled) return;
                const rows = res?.data?.data ?? res?.data ?? [];
                const mapped: SearchProduct[] = rows.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    tags: item.tags || "",
                    brand: item.brand,
                    effective_price: item.effective_price,
                    image:
                        item.color_variants?.[0]?.gallery_images?.[0]?.image_url ??
                        "/assets/images/no-image.png",
                }));
                setAllProducts(mapped);
            } catch (err) {
                console.error("Navbar: error fetching products for search:", err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Close dropdowns when clicking outside them.
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
            if (
                mobileSearchWrapRef.current &&
                !mobileSearchWrapRef.current.contains(e.target as Node)
            ) {
                setMobileSearchOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function runSearch(query: string) {
        setSearchQuery(query);
        const q = query.trim().toLowerCase();
        if (!q) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        const matches = allProducts.filter((p) => {
            const nameMatch = p.name.toLowerCase().includes(q);
            const tagMatch = p.tags
                .split(",")
                .some((tag) => tag.trim().toLowerCase().includes(q));
            const brandMatch = p.brand?.toLowerCase().includes(q);
            return nameMatch || tagMatch || brandMatch;
        });
        setSearchResults(matches.slice(0, 6));
        setShowDropdown(true);
    }

    function goToProduct(product: SearchProduct) {
        setSearchQuery("");
        setSearchResults([]);
        setShowDropdown(false);
        setMobileSearchOpen(false);
        router.push(`/product-details?id=${product.id}`);
    }

    function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" && searchResults.length > 0) {
            goToProduct(searchResults[0]);
        }
    }

    const isActive = (href: string, exact = false) =>
        exact ? pathname === href : pathname.startsWith(href);

    // Builds the href for any category coming straight from the API list
    // (used inside the mega menu, where every category is shown).
    const getCategoryHrefById = (category: CategoryItem) =>
        `/all-products?categoryName=${encodeURIComponent(category.name)}&categoryId=${category.id}`;

    // ---------- Mega menu panel ----------
    const renderMegaMenu = () => {
        if (!megaMenuOpen) return null;

        return (
            <div
                onMouseEnter={openMegaMenu}
                onMouseLeave={scheduleCloseMegaMenu}
                style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    width: "750px",
                    maxWidth: "95vw",
                    background: "#fff",
                    border: "1px solid var(--border, #e5e5e5)",
                    borderRadius: "10px",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                    padding: "20px 25px",
                    zIndex: 100,
                    display: "flex",
                    gap: "32px",
                }}
            >
                {/* Left: all categories from the API, in a scannable multi-column list */}
                <div style={{ flex: "1 1 45%" }}>
                    <h6 style={{ marginBottom: 16, fontWeight: 700 }}>Shop by Category</h6>
                    {categories.length === 0 ? (
                        <p style={{ fontSize: 14, color: "#888" }}>Loading categories…</p>
                    ) : (
                        <ul
                            style={{
                                listStyle: "none",
                                margin: 0,
                                padding: 0,
                                columnCount: 2,
                                columnGap: "20px",
                            }}
                        >
                            {categories.map((cat) => (
                                <li key={cat.id} style={{ breakInside: "avoid", marginBottom: 12 }}>
                                    <Link
                                        href={getCategoryHrefById(cat)}
                                        onClick={() => setMegaMenuOpen(false)}
                                        style={{
                                            display: "block",
                                            fontSize: 14,
                                            color: "#333",
                                            textDecoration: "none",
                                        }}
                                    >
                                        {cat.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Right: the 3 promo cards, image sourced from the category's cover_url */}
                <div style={{ flex: "1 1 55%" }}>
                    <img src="/assets/images/Logo-Dark.png" height={35} alt="Logo"className="d-flex mx-auto mb-2" />
                    <h6 style={{ marginBottom: 16, fontWeight: 700, textAlign: "center" }}>
                        Our Special Offers
                    </h6>
                    <div style={{ display: "flex", gap: "10px" }}>
                        {MEGA_MENU_PROMOS.map((promo) => (
                            <div
                                key={promo.name}
                                style={{
                                    flex: 1,
                                    position: "relative",
                                    display: "block",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    aspectRatio: "1 / 2",
                                    backgroundImage: `url(${promo.image})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "top",
                                    backgroundRepeat: "no-repeat",
                                }}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // The 3 nav items, rendered identically for the desktop and mobile lists.
    const renderNavLinks = () => (
        <>
            <li className="nav-item">
                <Link href="/" className={`nav-link ${isActive("/", true) ? "active" : ""}`}>
                    Home
                </Link>
            </li>

            <li
                className="nav-item"
                style={{ position: "relative" }}
                onMouseEnter={openMegaMenu}
                onMouseLeave={scheduleCloseMegaMenu}
            >
                <a
                    href="#"
                    className={`nav-link ${megaMenuOpen ? "active" : ""}`}
                    onClick={toggleMegaMenu}
                >
                    Woman
                </a>
                {renderMegaMenu()}
            </li>

            <li className="nav-item">
                <Link
                    href="/all-products"
                    className={`nav-link ${isActive("/all-products") ? "active" : ""}`}
                >
                    All Products
                </Link>
            </li>
        </>
    );

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

                                <a href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setMobileSearchOpen((v) => !v);
                                    }}
                                >
                                    <i className="bx bx-search"></i>
                                </a>
                                <Link
                                    href={{ pathname: "/profile", query: { tab: 3 } }}
                                    className={`nav-link ${isActive("/profile") ? "active" : ""}`}
                                    onClick={(e) => guardedNavigate(e, "/profile?tab=3")}
                                    style={{ position: "relative" }}
                                >
                                    <i className="bx bx-heart"></i>
                                    {cartWishlistSummary?.data?.has_wishlist && (
                                        <span
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                right: 0,
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                background: "var(--main)",
                                            }}
                                        />
                                    )}
                                </Link>
                                <Link
                                    href="/cart"
                                    className={`nav-link ${isActive("/cart") ? "active" : ""}`}
                                    onClick={(e) => guardedNavigate(e, "/cart")}
                                    style={{ position: "relative" }}
                                >
                                    <i className="bx bx-shopping-bag"></i>
                                    {!!cartWishlistSummary?.data?.cart_count && (
                                        <span
                                            style={{
                                                position: "absolute",
                                                top: -4,
                                                right: -6,
                                                minWidth: 15,
                                                height: 15,
                                                padding: "0 3px",
                                                borderRadius: "50%",
                                                background: "var(--main)",
                                                color: "var(--secondary)",
                                                fontSize: 10,
                                                lineHeight: "15px",
                                                textAlign: "center",
                                            }}
                                        >
                                            {cartWishlistSummary.data.cart_count}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    href="/profile"
                                    className={`nav-link ${isActive("/profile") ? "active" : ""}`}
                                    onClick={(e) => guardedNavigate(e, "/profile")}
                                >
                                    <i className="bx bx-user"></i>
                                </Link>
                            </div>
                        </div>
                        {mobileSearchOpen && (
                            <div
                                ref={mobileSearchWrapRef}
                                style={{ position: "relative", padding: "10px 0" }}
                            >
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search products..."
                                    autoFocus
                                    value={searchQuery}
                                    onChange={(e) => runSearch(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                                />
                                {showDropdown && (
                                    <ul
                                        style={{
                                            position: "absolute",
                                            top: "100%",
                                            left: 0,
                                            right: 0,
                                            background: "#fff",
                                            border: "1px solid var(--border, #e5e5e5)",
                                            borderRadius: "6px",
                                            listStyle: "none",
                                            margin: "4px 0 0",
                                            padding: "4px 0",
                                            zIndex: 50,
                                            maxHeight: "320px",
                                            overflowY: "auto",
                                        }}
                                    >
                                        {searchResults.length > 0 ? (
                                            searchResults.map((p) => (
                                                <li
                                                    key={p.id}
                                                    onClick={() => goToProduct(p)}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "10px",
                                                        padding: "8px 12px",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <img
                                                        src={p.image}
                                                        alt={p.name}
                                                        style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }}
                                                    />
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                                                        <div style={{ fontSize: 12, color: "#888" }}>&#8377; {p.effective_price}</div>
                                                    </div>
                                                </li>
                                            ))
                                        ) : (
                                            <li style={{ padding: "8px 12px", fontSize: 13, color: "#888" }}>
                                                No products found
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        )}
                        <ul className="navbar-nav flex-row align-items-center justify-content-between mt-3 response-nav-content">
                            {renderNavLinks()}
                        </ul>
                    </div>
                    {/* Web Navbar */}
                    <div className="navbar-collapse d-lg-flex justify-content-evenly align-items-center collapse" id="navbarcontent">
                        <div className="navbar-brand col-lg-1 me-0">
                            <Link href="/">
                                <img src="/assets/images/Logo-Dark.png" height={55} alt="Logo" />
                            </Link>
                        </div>
                        <div className="col-lg-5">
                            <ul className="navbar-nav align-items-lg-center justify-content-lg-evenly navbarNav">
                                {renderNavLinks()}
                            </ul>
                        </div>
                        <ul className="navbar-nav col-lg-3 mb-0">
                            <li className="search-bar" ref={searchWrapRef} style={{ position: "relative" }}>
                                <i className="bx bx-search text-center"></i>
                                <input
                                    type="text"
                                    className="form-control border-0"
                                    name="search"
                                    id="search"
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChange={(e) => runSearch(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                                    autoComplete="off"
                                />
                                {showDropdown && (
                                    <ul
                                        style={{
                                            position: "absolute",
                                            top: "100%",
                                            left: 0,
                                            right: 0,
                                            background: "#fff",
                                            border: "1px solid var(--border, #e5e5e5)",
                                            borderRadius: "6px",
                                            listStyle: "none",
                                            margin: "4px 0 0",
                                            padding: "4px 0",
                                            zIndex: 50,
                                            maxHeight: "360px",
                                            overflowY: "auto",
                                            boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                                        }}
                                    >
                                        {searchResults.length > 0 ? (
                                            searchResults.map((p) => (
                                                <li
                                                    key={p.id}
                                                    onClick={() => goToProduct(p)}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "10px",
                                                        padding: "8px 12px",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <img
                                                        src={p.image}
                                                        alt={p.name}
                                                        style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }}
                                                    />
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{p.name}</div>
                                                        <div style={{ fontSize: 12, color: "#888" }}>&#8377; {p.effective_price}</div>
                                                    </div>
                                                </li>
                                            ))
                                        ) : (
                                            <li style={{ padding: "8px 12px", fontSize: 13, color: "#888" }}>
                                                No products found
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </li>
                        </ul>
                        <ul className="navbar-nav col-lg-3 d-flex align-items-center flex-row icon-end">
                            <li className="nav-item">
                                <Link
                                    href={{ pathname: "/profile", query: { tab: 3 } }}
                                    className={`nav-link nav-icon-btn ${isActive("/profile") ? "active" : ""}`}
                                    title="Wishlist"
                                    onClick={(e) => guardedNavigate(e, "/profile?tab=3")}
                                    style={{ position: "relative" }}
                                >
                                    <i className="bx bx-heart"></i>
                                    {cartWishlistSummary?.data?.has_wishlist && (
                                        <span
                                            style={{
                                                position: "absolute",
                                                top: 1,
                                                right: 1,
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                background: "var(--main)",
                                            }}
                                        />
                                    )}
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    href="/cart"
                                    className={`nav-link nav-icon-btn ${isActive("/cart") ? "active" : ""}`}
                                    title="Cart"
                                    onClick={(e) => guardedNavigate(e, "/cart")}
                                    style={{ position: "relative" }}
                                >
                                    <i className="bx bx-shopping-bag"></i>
                                    {!!cartWishlistSummary?.data?.cart_count && (
                                        <span
                                            style={{
                                                position: "absolute",
                                                top: -4,
                                                right: -3,
                                                minWidth: 15,
                                                height: 15,
                                                padding: "0 3px",
                                                borderRadius: "50%",
                                                background: "var(--main)",
                                                color: "var(--secondary)",
                                                fontSize: 10,
                                                lineHeight: "15px",
                                                textAlign: "center",
                                            }}
                                        >
                                            {cartWishlistSummary.data.cart_count}
                                        </span>
                                    )}
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    href="/profile"
                                    className={`nav-link nav-icon-btn ${isActive("/profile") ? "active" : ""}`}
                                    title="Profile"
                                    onClick={(e) => guardedNavigate(e, "/profile")}
                                >
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