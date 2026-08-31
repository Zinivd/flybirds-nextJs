"use client";
import { Suspense, useState } from "react";
import Navbar from "../components/navbar/navbar";
import Footer from "../components/footer/footer";
import "./faq.css";

const categories = {
    General: [
        {
            q: "What is Flybirds Leggings?",
            a: "Flybirds is a Tirupur-based textile brand manufacturing and selling high-quality leggings, sarees shappers, kurti pants, and activewear at affordable prices.",
        },
        {
            q: "How do I place an order?",
            a: "Browse our collections, select your size, add to cart, and check out using any of our secure payment options.",
        },
        {
            q: "Can I request a bulk / wholesale order?",
            a: "Yes, reach out to us via the Contact Us page with your requirement and we'll get back with pricing.",
        },
        {
            q: "Which payment methods do you accept?",
            a: "We accept UPI, credit/debit cards, net banking, and Cash on Delivery for eligible pin codes.",
        },
    ],
    "Account & security": [
        {
            q: "How do I manage my account?",
            a: "Go to Profile after logging in to update your address, view order history, and manage saved details.",
        },
        {
            q: "How do I reset my password?",
            a: "Click 'Forgot Password' on the login page and follow the OTP verification steps to reset it.",
        },
        {
            q: "Is my data safe on this platform?",
            a: "Yes, we use industry-standard encryption and never store your card details. See our Privacy Policy for details.",
        },
    ],
    "Features & tools": [
        {
            q: "Do you have a size guide?",
            a: "Yes, check our Size Guide page for detailed measurements across all product categories.",
        },
        {
            q: "Can I track my order?",
            a: "Yes, go to Profile > Order History to track the live status of your shipment.",
        },
        {
            q: "How do I contact customer support?",
            a: "Email info@flybirdsleggings.com, call +91 98404 80118, or use the form on our Contact Us page.",
        },
    ],
};

type CategoryKey = keyof typeof categories;

export default function FaqAnswersPage() {
    const [activeCategory, setActiveCategory] = useState<CategoryKey>("General");
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <>
        <Suspense fallback={null}>
            <Navbar />
            </Suspense>
            <section className="faq-page">
                <span className="faq-tag">/ FAQS</span>
                <div className="faq-header">
                    <h1>Frequently Asked Questions</h1>
                    <p>Here&apos;s everything you need to know about orders, sizing, your account, and returns.</p>
                </div>

                <div className="faq-grid">
                    <div className="faq-sidebar">
                        {Object.keys(categories).map((cat) => (
                            <button
                                key={cat}
                                className={`faq-cat-btn ${activeCategory === cat ? "active" : ""}`}
                                onClick={() => {
                                    setActiveCategory(cat as CategoryKey);
                                    setOpenIndex(0);
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="faq-list">
                        {categories[activeCategory].map((item, i) => (
                            <div className="faq-item" key={i}>
                                <button
                                    className="faq-question"
                                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                >
                                    <span>{item.q}</span>
                                    <span className="faq-icon">{openIndex === i ? "−" : "+"}</span>
                                </button>
                                {openIndex === i && <p className="faq-answer">{item.a}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <Footer />
        </>
    );
}