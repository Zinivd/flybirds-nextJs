// app/components/testimonial/testimonial.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { getTestimonials } from "@/app/lib/api";

import "./testimonial.css"

interface Review {
    title: string;
    body: string;
    rating: number;
    reviewer: string;
    verified: boolean;
}

function mapReview(r: any): Review {
    return {
        title: r.title ?? "",
        body: r.description ?? r.body ?? "",
        rating: Number(r.rating ?? 0),
        reviewer: r.user?.name ?? r.customer_name ?? "Customer",
        verified: !!r.verified,
    };
}

export default function Testimonial() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        loadTestimonials();
        return () => stopAutoPlay();
    }, []);

    async function loadTestimonials() {
        setIsLoading(true);
        try {
            const res = await getTestimonials<any>();
            const rows = res?.data?.data ?? res?.data ?? [];
            const mapped = rows.map(mapReview);
            setReviews(mapped);
            if (mapped.length > 1) startAutoPlay(mapped.length);
        } catch (err) {
            console.error("Error fetching testimonials:", err);
        } finally {
            setIsLoading(false);
        }
    }

    function startAutoPlay(length: number) {
        intervalRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % length);
        }, 4000);
    }

    function stopAutoPlay() {
        if (intervalRef.current) clearInterval(intervalRef.current);
    }

    function resetAutoPlay() {
        stopAutoPlay();
        if (reviews.length > 1) startAutoPlay(reviews.length);
    }

    function prev() {
        if (!reviews.length) return;
        setCurrentIndex((i) => (i - 1 + reviews.length) % reviews.length);
        resetAutoPlay();
    }

    function next() {
        if (!reviews.length) return;
        setCurrentIndex((i) => (i + 1) % reviews.length);
        resetAutoPlay();
    }

    const currentReview = reviews.length ? reviews[currentIndex] : null;
    const starArray = currentReview
        ? Array.from({ length: 5 }, (_, i) => i < currentReview.rating)
        : [];

    if (isLoading) {
        return (
            <div className="text-center py-4">
                <div className="spinner-border text-main"></div>
            </div>
        );
    }

    if (!reviews.length) {
        return (
            <div className="text-center text-muted py-4">
                <i className="fas fa-star fa-2x mb-3"></i>
                <p>No Customer Reviews Yet.</p>
            </div>
        );
    }

    return (
        <div className="carousel-wrap">
            {reviews.length > 1 && (
                <button className="nav-btn nav-prev" onClick={prev} aria-label="Previous review">
                    <i className="fas fa-angle-left"></i>
                </button>
            )}

            <div className="carousel-track">
                <div className="testimonial-box">
                    <h5>{currentReview!.title}</h5>
                    <h6>{currentReview!.body}</h6>
                    <div className="stars">
                        {starArray.map((filled, i) => (
                            <span key={i}>
                                <i className={filled ? "fa-solid fa-star" : "fa-regular fa-star"}></i>
                            </span>
                        ))}
                    </div>
                    <h6 className="reviewer">- {currentReview!.reviewer}</h6>
                </div>
            </div>

            {reviews.length > 1 && (
                <button className="nav-btn nav-next" onClick={next} aria-label="Next review">
                    <i className="fas fa-angle-right"></i>
                </button>
            )}
        </div>
    );
}