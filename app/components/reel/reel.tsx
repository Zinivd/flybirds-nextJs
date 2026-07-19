// app/components/reel/reel.tsx
"use client";

import { useEffect, useRef } from "react";
import { ReelItem } from "@/app/types/shop.models";

import "./reel.css"

interface ReelProps {
    reel: ReelItem;
    isActive: boolean;
    onVideoEnded: () => void;
}

export default function Reel({ reel, isActive, onVideoEnded }: ReelProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isActive) {
            video.currentTime = 0;
            video.play().catch((err) => console.warn("Video play blocked:", err));
        } else {
            video.pause();
        }
    }, [isActive]);

    return (
        <div className="reel-box" id={String(reel.id)}>
            <div className="reel-img">
                <video
                    ref={videoRef}
                    src={reel.video_url}
                    muted
                    playsInline
                    preload="metadata"
                    onEnded={onVideoEnded}
                />
                <div className="reel-overlay"></div>
                <div className="reel-logo">
                    <img src="/assets/images/Logo-White.png" alt="Flybirds" />
                </div>
                <h6 className="mb-0">{reel.title}</h6>
            </div>
        </div>
    );
}