"use client";
import { Suspense, useState } from "react";
import Navbar from "../components/navbar/navbar";
import Footer from "../components/footer/footer";
import "./contact-us.css";

export default function ContactUsPage() {
    const [form, setForm] = useState({ name: "", phone: "", inquiry: "Buying Property", message: "" });
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!agreed) return;
        setSubmitting(true);
        try {
            // TODO: wire up to your contact API endpoint
            // await submitContactForm(form);
            setForm({ name: "", phone: "", inquiry: "Buying Property", message: "" });
            setAgreed(false);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
        <Suspense fallback={null}>
            <Navbar />
            </Suspense>
            <section className="contact-page">
                <div className="contact-grid">
                    <div className="contact-left">
                        <span className="contact-tag">Get in Touch</span>
                        <h1>Contact Us</h1>
                        <p>We&apos;re here to help with your orders, sizing, and product queries.</p>

                        <div className="contact-info-item">
                            <div className="contact-info-icon"><i className="bx bx-location"></i></div>
                            <div>
                                <h6>Office Location</h6>
                                <p>Fly Birds 819B, Boyampalayam Rd, Raja Nagar, Poyampalayam, Tiruppur, Chettipalayam, Tamil Nadu 641603</p>
                            </div>
                        </div>
                        <div className="contact-info-item">
                            <div className="contact-info-icon"><i className="bx bx-phone-forwarding"></i></div>
                            <div>
                                <h6>Phone</h6>
                                <p><a href="tel:+919840480118">+91 98404 80118</a></p>
                            </div>
                        </div>
                        <div className="contact-info-item">
                            <div className="contact-info-icon"><i className="bx bx-mail-open"></i></div>
                            <div>
                                <h6>Email</h6>
                                <p><a href="mailto:info@flybirdsleggings.com">info@flybirdsleggings.com</a></p>
                            </div>
                        </div>
                    </div>

                    <form className="contact-form" onSubmit={handleSubmit}>
                        <label>Full Name</label>
                        <input type="text" name="name" placeholder="Your name" value={form.name} onChange={handleChange} required />

                        <label>Phone Number</label>
                        <input type="tel" name="phone" placeholder="Your phone number" value={form.phone} onChange={handleChange} required />

                        <label>Inquiry Type</label>
                        <select name="inquiry" value={form.inquiry} onChange={handleChange}>
                            <option>Order Query</option>
                            <option>Returns & Exchange</option>
                            <option>Bulk / Wholesale Order</option>
                            <option>General Inquiry</option>
                        </select>

                        <label>Message (Optional)</label>
                        <textarea name="message" placeholder="Tell us more about your query." value={form.message} onChange={handleChange} rows={5} />

                        <button type="submit" disabled={!agreed || submitting}>
                            {submitting ? "Sending..." : "Submit"}
                        </button>

                        <label className="contact-checkbox">
                            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                            <span>
                                By submitting this form, I agree to the{" "}
                                <a href="/policies/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>.
                            </span>
                        </label>
                    </form>
                </div>

              
<div className="contact-map">
    <iframe
        title="Flybirds Leggings Location"
        src="https://www.google.com/maps?q=819B%2C+Boyampalayam+Rd%2C+Raja+Nagar%2C+Poyampalayam%2C+Chettipalayam%2C+Tamil+Nadu+641603&output=embed"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{
            width: "100%",
            height: "400px",
            border: 0,
        }}
    />
</div>


            </section>
            <Footer />
        </>
    );
}