// app/components/category/category.tsx
import Link from "next/link";
import { CategoryItem } from "@/app/types/shop.models";

import "./category.css"

export default function Category({ category }: { category: CategoryItem }) {
    return (
        <Link href={`/all-products/${category.name}/${category.id}`}>
            <div className="category-box mb-4">
                <img src={category.banner_url} alt={category.name} className="mb-2" />
                <h6 className="mb-0">{category.name}</h6>
            </div>
        </Link>
    );
}