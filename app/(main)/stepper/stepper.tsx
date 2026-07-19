import { Fragment } from "react";

import "./stepper.css";

interface CheckoutStepperProps {
    current: 1 | 2 | 3;
}

const steps = [
    { n: 1, label: "Address" },
    { n: 2, label: "Payment" },
    { n: 3, label: "Review" },
] as const;

export default function CheckoutStepper({ current }: CheckoutStepperProps) {
    return (
        <div className="stepper mb-4">
            {steps.map((step, idx) => (
                <Fragment key={step.n}>
                    <div
                        className={`step ${current === step.n ? "active" : current > step.n ? "done" : ""
                            }`}
                    >
                        <div className="step-circle">{step.n}</div>
                        <span className="step-label">{step.label}</span>
                    </div>
                    {idx < steps.length - 1 && <div className="connector" />}
                </Fragment>
            ))}
        </div>
    );
}