import PolicyLayout from "../_components/PolicyLayout";

export default function ReturnPolicyPage() {
    return (
        <PolicyLayout
            title="Return Policy"
            updated="August 2026"
            intro="We want you to love your Flybirds purchase. If something isn't right, here's how our return process works."
            sections={[
                {
                    heading: "Return Eligibility",
                    points: [
                        "Returns are accepted within 7 days of delivery.",
                        "Items must be unused, unwashed, and returned with original tags and packaging intact.",
                        "Products purchased during clearance or final sale are not eligible for return.",
                    ],
                },
                {
                    heading: "Non-Returnable Items",
                    points: [
                        "For hygiene reasons, innerwear and certain intimate categories cannot be returned once the packaging is opened.",
                        "Products damaged due to misuse are not eligible for return.",
                    ],
                },
                {
                    heading: "How to Initiate a Return",
                    points: [
                        "Log in to your account and go to Profile > Order History to raise a return request.",
                        "Alternatively, contact our support team with your order number.",
                        "Our courier partner will pick up the item from your registered address.",
                    ],
                },
                {
                    heading: "Exchange",
                    points: [
                        "Size or product exchanges are subject to stock availability.",
                        "Exchange requests follow the same 7-day window as returns.",
                    ],
                },
                {
                    heading: "Inspection & Approval",
                    points: [
                        "Returned items are inspected on arrival at our facility in Tirupur.",
                        "Approved returns are processed as per our Refund Policy.",
                    ],
                },
            ]}
        />
    );
}