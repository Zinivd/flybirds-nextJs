"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCategoryList } from "@/app/lib/api";

import "./footer.css"

interface ShopAllItem {
    label: string;
    link: string;
}

function slugify(name: string) {
    return (name || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

const quickLinks = [
    { label: "Our Story", link: "" },
    { label: "FAQ's", link: "" },
    { label: "Blogs", link: "" },
    { label: "Testimonials", link: "" },
    { label: "Contact Us", link: "" },
];

const helpLinks = [
    { label: "Track Your Order", link: "" },
    { label: "Customer Support", link: "" },
    { label: "Profile", link: "" },
    { label: "Returns & Exchange", link: "" },
    { label: "Size Guide", link: "" },
];

const shopLinks = [
    { label: "Shimmer Leggings", link: "" },
    { label: "Saree Shapper", link: "" },
    { label: "Yoga Shorts", link: "" },
    { label: "Kurti Pants", link: "" },
    { label: "Chudithar Leggings", link: "" },
    { label: "Ankle Leggings", link: "" },
];

const policyLinks = [
    { label: "Terms & Conditions", link: "" },
    { label: "Return Policy", link: "" },
    { label: "Support Policy", link: "" },
    { label: "Privacy Policy", link: "" },
];

const socialLinks = [
    { id: "facebook", icon: "fa-brands fa-facebook-f", href: "", title: "Facebook" },
    { id: "instagram", icon: "fa-brands fa-instagram", href: "", title: "Instagram" },
    { id: "linkedin", icon: "fa-brands fa-linkedin-in", href: "", title: "LinkedIn" },
    { id: "youtube", icon: "fa-brands fa-youtube", href: "", title: "YouTube" },
];

export default function Footer() {
    const [shopAllItems, setShopAllItems] = useState<ShopAllItem[]>([]);
    const [isShopAllLoading, setIsShopAllLoading] = useState(true);

    const getcurrentyear = new Date().getFullYear();

    useEffect(() => {
        // const getcurrentyear = new Date().getFullYear();
        loadCategories();
    }, []);

    async function loadCategories() {
        setIsShopAllLoading(true);
        try {
            const res = await getCategoryList<any>();
            const rows = res?.data ?? [];
            setShopAllItems(
                rows.map((cat: any) => ({
                    label: cat.name,
                    link: `/all-products?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`,
                }))
            );
        } catch (err) {
            console.error("Error fetching categories for footer:", err);
        } finally {
            setIsShopAllLoading(false);
        }
    }




    return (
        <>
            {/* Disclaimer */}
            <div className="disclaimer">
                <div className="disclaimer-div">
                    <i className="fas fa-circle-exclamation"></i>
                    <div className="disclaimer-content">
                        <h5 className="mb-3">Flybirds Leggings</h5>
                        <h6 className="mb-0">
                            At Flybirds, we pride ourselves on delivering unparalleled quality at a price that suits your budget.
                            Our commitment to excellence has made us the biggest seller in Tirupur, earning the trust and loyalty
                            of our customers.
                        </h6>
                    </div>
                </div>
            </div>

            {/* Shop All */}
            <div className="shop-all">
                <div className="shop-all-div">
                    <h3 className="mb-3">Shop All</h3>
                    {!isShopAllLoading && (
                        <ul className="nav ps-0 flex-row column-gap-1">
                            {shopAllItems.map((item, i) => (
                                <li className="nav-item mb-1 text-capitalize" key={item.link}>
                                    <Link href={item.link} className="nav-link">{item.label}</Link>
                                    {i < shopAllItems.length - 1 && <span className="nav-link">|</span>}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-main">
                    <div className="footer-top">
                        <div className="footer-item mb-2">
                            <div className="d-flex justify-content-start align-items-start flex-column">
                                <div className="footer-logo">
                                    <img src="/assets/images/Logo-White.png" className="d-flex mx-auto" height={80} alt="Flybirds Logo" />
                                </div>
                            </div>
                        </div>
                        <div className="footer-item mb-2">
                            <h5>Get a Special Discount on your inbox</h5>
                            <div className="input-group">
                                <input type="text" name="subscribe" id="subscribe" className="form-control" placeholder="Email Address" />
                                <button type="button" className="subscribe-btn">Subscribe</button>
                            </div>
                        </div>
                    </div>

                    <br />

                    <div className="footer-middle">
                        <div className="footer-item mb-2">
                            <li className="nav-item mb-2 text-white">Follow Us on Social Media</li>
                            <ul className="nav flex-row column-gap-2" id="brands">
                                {socialLinks.map((social) => (
                                    <li className="nav-item mb-3" key={social.id}>
                                        <a href={social.href} id={social.id} target="_blank" rel="noreferrer"
                                            data-bs-toggle="tooltip" data-bs-placement="right" data-bs-title={social.title}>
                                            <div className="brand-icons">
                                                <i className={social.icon}></i>
                                            </div>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="footer-item mb-2">
                            <h5>Quick Links</h5>
                            <ul className="nav flex-column">
                                {quickLinks.map((item) => (
                                    <li className="nav-item mb-2" key={item.label}>
                                        <Link className="p-0" href={item.link || "#"}>{item.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="footer-item mb-2">
                            <h5>Help</h5>
                            <ul className="nav flex-column">
                                {helpLinks.map((item) => (
                                    <li className="nav-item mb-2" key={item.label}>
                                        <Link className="p-0" href={item.link || "#"}>{item.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="footer-item mb-2">
                            <h5>Shop</h5>
                            <ul className="nav flex-column">
                                {shopLinks.map((item) => (
                                    <li className="nav-item mb-2" key={item.label}>
                                        <Link className="p-0" href={item.link || "#"}>{item.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="footer-item mb-2">
                            <h5>Policies</h5>
                            <ul className="nav flex-column">
                                {policyLinks.map((item) => (
                                    <li className="nav-item mb-2" key={item.label}>
                                        <Link className="p-0" href={item.link || "#"}>{item.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <hr className="mt-3 mb-4" />

                    <div className="footer-bottom">
                        <div className="footer-item mb-2">
                            <div className="footer-bottom-icon"><i className="bx bx-mail-open text-white"></i></div>
                            <div className="footer-bottom-content w-100">
                                <h6 className="mb-1">Email ID</h6>
                                <a href="mailto:info@flybirdsleggings.com"><h5 className="mb-0">info@flybirdsleggings.com</h5></a>
                            </div>
                        </div>
                        <div className="footer-item mb-2">
                            <div className="footer-bottom-icon"><i className="bx bx-phone-forwarding text-white"></i></div>
                            <div className="footer-bottom-content w-100">
                                <h6 className="mb-1">Phone No</h6>
                                <a href="tel:+918825522322"><h5 className="mb-0">+91 88255 22322</h5></a>
                            </div>
                        </div>
                        <div className="footer-item mb-2">
                            <div className="footer-bottom-icon"><i className="bx bx-location text-white"></i></div>
                            <div className="footer-bottom-content">
                                <h6 className="mb-1">Address</h6>
                                <a href="#"><h5 className="mb-0">423 B, 4th St, Raja Nagar, Poyampalayam, Tirupur, Tamil Nadu 641603</h5></a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="footer-copyrights mt-3">
                    <h6 className="text-center mb-0">© {getcurrentyear} FLYBIRDS LEGGINGS All Rights Reserved.</h6>
                    <h6 className="text-center mb-0">Design & Developed by <a href="https://www.zinivd.com/" target="_blank" className="text-white1">Zinivd</a></h6>
                </div>
            </footer>
        </>
    );
}