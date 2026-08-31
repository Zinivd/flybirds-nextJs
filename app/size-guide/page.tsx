import Navbar from "../components/navbar/navbar";
import Footer from "../components/footer/footer";
import "./size-guide.css";
import { Suspense } from "react";

const sizeChart = [
    { size: "S", waist: "26 - 28", hip: "34 - 36" },
    { size: "M", waist: "28 - 30", hip: "36 - 38" },
    { size: "L", waist: "30 - 32", hip: "38 - 40" },
    { size: "XL", waist: "32 - 34", hip: "40 - 42" },
    { size: "XXL", waist: "34 - 36", hip: "42 - 44" },
];

export default function SizeGuidePage() {
    return (
        <>
        <Suspense fallback={null}>
            <Navbar />
            </Suspense>
            <section className="size-guide-page">
                <span className="size-tag">Size Guide</span>
                <h1>Find Your Perfect Fit</h1>
                <p className="size-intro">
                    All measurements are in inches. For the most comfortable fit, measure yourself over undergarments and
                    compare against the chart below. If you fall between two sizes, we recommend sizing up.
                </p>

                <div className="size-table-wrap">
                    <table className="size-table">
                        <thead>
                            <tr>
                                <th>Size</th>
                                <th>Waist (in)</th>
                                <th>Hip (in)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sizeChart.map((row) => (
                                <tr key={row.size}>
                                    <td>{row.size}</td>
                                    <td>{row.waist}</td>
                                    <td>{row.hip}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="size-tips">
                    <h2>How to Measure</h2>
                    <ul>
                        <li><strong>Waist:</strong> Measure around the narrowest part of your natural waistline.</li>
                        <li><strong>Hip:</strong> Measure around the fullest part of your hips, keeping the tape level.</li>
                        <li>Use a soft measuring tape and keep it snug but not tight against your body.</li>
                        <li>Still unsure? Contact us and our team will help you pick the right size.</li>
                    </ul>
                </div>
            </section>
            <Footer />
        </>
    );
}