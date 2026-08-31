import PolicyLayout from "../_components/PolicyLayout";

export default function PrivacyPolicyPage() {
    return (
        <PolicyLayout
            title="Privacy Policy"
            updated="August 2026"
            intro="Your privacy matters to us. This policy explains what data we collect, how we use it, and how we protect it."
            sections={[
                {
                    heading: "Information We Collect",
                    points: [
                        "Personal details you provide: name, phone number, email, and shipping address.",
                        "Order and payment history (payment card details are handled directly by our payment gateway, not stored by us).",
                        "Usage data such as pages visited and products viewed, via cookies.",
                    ],
                },
                {
                    heading: "How We Use Your Information",
                    points: [
                        "To process and deliver your orders.",
                        "To send order updates, offers, and newsletters (you can unsubscribe anytime).",
                        "To improve our website and product recommendations.",
                    ],
                },
                {
                    heading: "Sharing of Information",
                    points: [
                        "We share order details with courier and logistics partners solely to fulfil deliveries.",
                        "We do not sell your personal information to third parties.",
                    ],
                },
                {
                    heading: "Data Security",
                    points: [
                        "We use industry-standard security measures to protect your data.",
                        "Access to customer data is restricted to authorized personnel only.",
                    ],
                },
                {
                    heading: "Your Rights",
                    points: [
                        "You may request access to, correction of, or deletion of your personal data by contacting support.",
                        "You can manage cookie preferences through your browser settings.",
                    ],
                },
            ]}
        />
    );
}