// app/components/spotlight/spotlight.tsx
import Link from "next/link";
import { SpotlightItem } from "@/app/types/shop.models";
import "./spotlight.css";

export default function Spotlight({ spotlight }: { spotlight: SpotlightItem }) {
    return (
        <Link
            href={`/product-details/?id=${spotlight.product_id}`}
            className="spotlight-box"
            aria-label={spotlight.title}
        >
            <img src={spotlight.image_url} alt={spotlight.title} />
        </Link>
    );
}