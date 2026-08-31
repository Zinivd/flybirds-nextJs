import Navbar from "../components/navbar/navbar";
import Footer from "../components/footer/footer";
import Link from "next/link";
import "./about-us.css";
import { Suspense } from "react";

const process = [
    {
        title: "Knitting, Heat Setting, Dyeing, Compacting - Fabric",
        desc: "At Flybirds, we begin with the finest raw materials, employing a meticulous process of knitting, heat setting, dyeing, and compacting to create fabrics of exceptional quality.",
    },
    {
        title: "Cutting",
        desc: "Precision is our hallmark. Our cutting-edge technology ensures that every piece is crafted with accuracy, setting the foundation for a flawless final product.",
    },
    {
        title: "Stitching",
        desc: "Our skilled artisans bring your garments to life through expert stitching techniques, ensuring durability and a perfect fit.",
    },
    {
        title: "Checking",
        desc: "Quality control is ingrained in our process. Each item undergoes rigorous checks to meet the highest standards before it reaches our customers.",
    },
    {
        title: "Ironing & Packing",
        desc: "The finishing touch is as important as the initial craftsmanship. Our garments are meticulously ironed and elegantly packed, ready to make a statement.",
    },
];

export default function AboutUsPage() {
    return (
        <>
        <Suspense fallback={null}>
            <Navbar />
            </Suspense>
            <section className="about-hero">
                <span className="about-breadcrumb">Home / About</span>
                <h1>About Flybirds</h1>
                <p>
                    Established in 2011, Flybirds has been a prominent player in the textile industry, setting the standard
                    for high-quality fabric production and garment manufacturing. With a commitment to excellence, we have
                    become the leading choice for customers in Tirupur and beyond.
                </p>
            </section>

            <section className="about-process">
                <div className="about-process-header">
                    <span className="about-tag">Our Process</span>
                    <h2>Crafting Perfection, Every Step of the Way</h2>
                </div>
                <div className="about-process-grid">
                    {process.map((step, i) => (
                        <div className="about-process-card" key={i}>
                            <span className="about-step-number">{String(i + 1).padStart(2, "0")}</span>
                            <h3>{step.title}</h3>
                            <p>{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="about-why">
                <div className="about-why-inner">
                    <span className="about-tag">Why Flybirds?</span>
                    <h2>High Quality @ Low Cost — Your Trusted Choice in Tirupur</h2>
                    <p>
                        At Flybirds, we pride ourselves on delivering unparalleled quality at a price that suits your budget.
                        Our commitment to excellence has made us the biggest seller in Tirupur, earning the trust and loyalty
                        of our customers.
                    </p>
                    <div className="about-motto">
                        <h4>Motto: High Quality @ Low Cost</h4>
                        <p>
                            Our motto is not just a slogan; it&apos;s a commitment. We believe that everyone deserves access
                            to top-notch textiles and garments without breaking the bank. Flybirds ensures you get the best
                            without compromising on quality.
                        </p>
                    </div>
                </div>
            </section>

            <section className="about-cta">
                <h2>Explore Our Collections</h2>
                <p>
                    Discover the latest trends and timeless classics in our diverse collections. From casual wear to formal
                    attire, Flybirds has something for every occasion.
                </p>
                <Link href="/all-products" className="about-cta-btn">Shop Now</Link>
            </section>
            <Footer />
        </>
    );
}