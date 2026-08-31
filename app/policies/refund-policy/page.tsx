import PolicyLayout from "../_components/PolicyLayout";

export default function RefundPolicyPage() {
    return (
        <PolicyLayout
            title="Refund Policy"
            updated="August 2026"
            intro="Once your return is approved, here's how and when you'll receive your refund."
            sections={[
                {
                    heading: "Refund Method",
                    points: [
                        "Refunds are issued to your original payment method.",
                        "For prepaid orders, refunds are credited within 5–7 business days after approval.",
                        "For COD orders, refunds are issued via bank transfer or store credit.",
                    ],
                },
                {
                    heading: "Order Cancellations",
                    points: [
                        "Orders can be cancelled free of charge before they are shipped.",
                        "Once an order is shipped, it can only be returned after delivery as per our Return Policy.",
                    ],
                },
                {
                    heading: "Shipping Charges",
                    points: [
                        "Original shipping charges (if any) are non-refundable, except in cases of defective or incorrect items shipped by us.",
                    ],
                },
                {
                    heading: "Non-Refundable Situations",
                    points: [
                        "Items returned without tags or in used condition.",
                        "Returns initiated after the 7-day window.",
                    ],
                },
            ]}
        />
    );
}