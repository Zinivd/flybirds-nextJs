// app/components/spotlight/spotlight-grid.tsx
import Spotlight from "./spotlight";
import { SpotlightItem } from "@/app/types/shop.models";
import "./spotlight.css";

const STATS = [
    { value: "2 Million+", label: "Happy Customers" },
    { value: "700+", label: "Bottomwear Styles" },
    { value: "60+", label: "Colors & Prints" },
    { value: "450+", label: "Exclusive Stores" },
];

export default function SpotlightGrid({ spotlights }: { spotlights: SpotlightItem[] }) {
    const items = spotlights
        .filter((item) => item.is_published && item.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .slice(0, 2);

    return (
        <>
            <div className="spotlight-grid">
                {items.map((item) => (
                    <Spotlight key={item.id} spotlight={item} />
                ))}
            </div>

            <div className="stats-grid">
                {STATS.map((stat) => (
                    <div className="stats-card" key={stat.label}>
                        <h4 className="stats-value">{stat.value}</h4>
                        <p className="stats-label">{stat.label}</p>
                    </div>
                ))}
            </div>
        </>
    );
}