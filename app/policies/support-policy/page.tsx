import PolicyLayout from "../_components/PolicyLayout";

export default function SupportPolicyPage() {
    return (
        <PolicyLayout
            title="Support Policy"
            updated="August 2026"
            intro="Our customer support team is here to help with orders, sizing, and product queries."
            sections={[
                {
                    heading: "How to Reach Us",
                    points: [
                        "Email: info@flybirdsleggings.com",
                        "Phone: +91 98404 80118",
                        "Contact form: available on our Contact Us page.",
                    ],
                },
                {
                    heading: "Support Hours",
                    points: [
                        "Monday to Saturday, 9:30 AM – 6:30 PM IST.",
                        "Queries received outside these hours are answered on the next working day.",
                    ],
                },
                {
                    heading: "Response Times",
                    points: [
                        "Email queries are answered within 24 business hours.",
                        "Order and shipping issues are prioritized and typically resolved within 48 hours.",
                    ],
                },
                {
                    heading: "Escalation",
                    points: [
                        "If your issue isn't resolved to your satisfaction, ask to escalate your ticket to a senior support representative.",
                    ],
                },
            ]}
        />
    );
}