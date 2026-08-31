// app/components/blog/blog.tsx
import Link from "next/link";
import { BlogItem } from "@/app/types/shop.models";
import "./blog.css";

function formatDate(dateStr: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

export default function Blog({ blog }: { blog: BlogItem }) {
    return (
        <div className="blog-box">
            <Link href={`/blog-details?id=${blog.id}`} className="blog-img">
                <img src={blog.cover_image_url} alt={blog.title} />
            </Link>
            <div className="blog-box-content">
                <Link href={`/blog-details?id=${blog.id}`}>
                    <h5 className="blog-title">{blog.title}</h5>
                </Link>
                <p className="blog-desc">{blog.sub_title}</p>
                <div className="blog-footer">
                    <span className="blog-date">
                        <i className="bx bx-calendar"></i>
                        {formatDate(blog.published_at)}
                    </span>
                    <Link href={`/blog-details?id=${blog.id}`} className="blog-read-link">
                        Read Blog <i className="bx bx-right-arrow-alt"></i>
                    </Link>
                </div>
            </div>
        </div>
    );
}