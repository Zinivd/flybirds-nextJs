import PolicyLayout from "../_components/PolicyLayout";

export default function TermsConditionsPage() {
    return (
        <PolicyLayout
            title="Terms & Conditions"
            updated="August 2026"
            intro="Welcome to Flybirds Leggings. By accessing or using our website, you agree to be bound by the following terms and conditions. Please read them carefully before placing an order."
            sections={[
                {
                    heading: "Use of Website",
                    points: [
                        "You must be at least 18 years old, or using the site under the supervision of a parent/guardian, to place an order.",
                        "You agree to provide accurate and complete information when creating an account or placing an order.",
                        "You are responsible for maintaining the confidentiality of your account login details.",
                    ],
                },
                {
                    heading: "Products & Pricing",
                    points: [
                        "All products are subject to availability. We reserve the right to limit quantities on any order.",
                        "Prices are listed in INR and are subject to change without prior notice.",
                        "We make every effort to display colors and sizes accurately, but slight variations may occur due to screen settings and manual production.",
                    ],
                },
                {
                    heading: "Orders & Payment",
                    points: [
                        "An order is confirmed only after successful payment and receipt of a confirmation email/SMS.",
                        "We reserve the right to cancel any order due to stock unavailability, pricing errors, or suspected fraud.",
                        "Payments are processed through secure, PCI-compliant payment gateways.",
                    ],
                },
                {
                    heading: "Intellectual Property",
                    points: [
                        "All content on this website — including logos, images, and product designs — is the property of Flybirds Leggings and may not be reproduced without permission.",
                    ],
                },
                {
                    heading: "Limitation of Liability",
                    points: [
                        "Flybirds Leggings is not liable for indirect or consequential damages arising from the use of our products or website.",
                        "We are not responsible for delays caused by courier partners or events beyond our reasonable control.",
                    ],
                },
                {
                    heading: "Governing Law",
                    points: [
                        "These terms are governed by the laws of India, and any disputes shall be subject to the jurisdiction of the courts in Tirupur, Tamil Nadu.",
                    ],
                },
            ]}
        />
    );
}