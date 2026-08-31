// app/(main)/blog-details/blog-details-content.tsx
"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getBlogById } from "@/app/lib/api";
import { BlogItem } from "@/app/types/shop.models";
import "./blog-details.css";

function formatDate(dateStr?: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

export default function BlogDetailsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get("id");
    const [blog, setBlog] = useState<BlogItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (!id) {
            setIsLoading(false);
            setHasError(true);
            return;
        }
        loadBlog(id);
    }, [id]);

    async function loadBlog(blogId: string) {
        setIsLoading(true);
        setHasError(false);
        try {
            const res = await getBlogById<any>(blogId);
            setBlog(res?.data ?? null);
        } catch (err) {
            console.error("Error fetching blog:", err);
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="blog-details-page">
            <div className="blog-details-card">
                <button
                    type="button"
                    className="back-link"
                    onClick={() => router.push("/")}
                >
                    <i className="bx bx-arrow-back"></i> Back to Insights
                </button>
                {isLoading && (
                    <div className="blog-details-skeleton">
                        <div className="skel-title skeleton"></div>
                        <div className="skel-title skeleton" style={{ width: "60%" }}></div>
                        <div className="skel-meta skeleton"></div>
                        <div className="skel-cover skeleton"></div>
                        <div className="skel-line skeleton"></div>
                        <div className="skel-line skeleton"></div>
                        <div className="skel-line skeleton" style={{ width: "70%" }}></div>
                    </div>
                )}
                {!isLoading && hasError && (
                    <div className="blog-details-empty">
                        <i className="bx bx-error-circle"></i>
                        <p className="mb-2">Couldn&apos;t load this article.</p>
                        <button className="retry-btn" onClick={() => id && loadBlog(id)}>
                            Retry
                        </button>
                    </div>
                )}
                {!isLoading && !hasError && !blog && (
                    <div className="blog-details-empty">
                        <i className="bx bx-file-blank"></i>
                        <p className="mb-0">This article doesn&apos;t exist or was removed.</p>
                    </div>
                )}
                {!isLoading && !hasError && blog && (
                    <>
                        <div className="blog-details-header">
                            <h1 className="blog-details-title">{blog.title}</h1>
                            {blog.sub_title && (
                                <p className="blog-details-subtitle">{blog.sub_title}</p>
                            )}
                            <div className="blog-details-meta">
                                {blog.product?.name && (
                                    <div className="blog-meta-item">
                                        <span className="blog-meta-label">Product</span>
                                        <span className="blog-meta-value">{blog.product.name}</span>
                                    </div>
                                )}
                                {blog.published_at && (
                                    <div className="blog-meta-item">
                                        <span className="blog-meta-label">Published</span>
                                        <span className="blog-meta-value">
                                            {formatDate(blog.published_at)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {blog.cover_image_url && (
                            <div className="blog-details-cover">
                                <img src={blog.cover_image_url} alt={blog.title} />
                            </div>
                        )}
                        <div className="blog-details-content">
                            {blog.description_1 && <p>{blog.description_1}</p>}
                            {blog.description_2 && <p>{blog.description_2}</p>}
                            {blog.description_3 && <p>{blog.description_3}</p>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}