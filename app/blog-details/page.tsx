// app/blog-details/page.tsx
import { Suspense } from "react";
import BlogDetailsContent from "./blog-details-content";

export default function BlogDetailsPage() {
    return (
        <Suspense
            fallback={
                <div className="blog-details-page">
                    <div className="blog-details-card">
                        <div className="blog-details-skeleton">
                            <div className="skel-title skeleton"></div>
                            <div className="skel-title skeleton" style={{ width: "60%" }}></div>
                            <div className="skel-meta skeleton"></div>
                            <div className="skel-cover skeleton"></div>
                            <div className="skel-line skeleton"></div>
                            <div className="skel-line skeleton"></div>
                            <div className="skel-line skeleton" style={{ width: "70%" }}></div>
                        </div>
                    </div>
                </div>
            }
        >
            <BlogDetailsContent />
        </Suspense>
    );
}