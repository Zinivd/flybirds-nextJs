import Navbar from "@/app/components/navbar/navbar";
import Footer from "@/app/components/footer/footer";
import "./policy.css";
import { Suspense } from "react";

interface PolicySection {
    heading: string;
    points: string[];
}

export default function PolicyLayout({
    title,
    updated,
    intro,
    sections,
}: {
    title: string;
    updated: string;
    intro: string;
    sections: PolicySection[];
}) {
    return (
        <>
        <Suspense fallback={null}>
            <Navbar />
            </Suspense>
            <div className="policy-page">
                <div className="policy-hero">
                    <h1>{title}</h1>
                    <p>Last updated: {updated}</p>
                </div>
                <div className="policy-body">
                    <p className="policy-intro">{intro}</p>
                    {sections.map((s, i) => (
                        <div className="policy-section" key={i}>
                            <h2>{s.heading}</h2>
                            <ul>
                                {s.points.map((p, j) => (
                                    <li key={j}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </>
    );
}