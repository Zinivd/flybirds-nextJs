"use client";

import { useEffect } from "react";

export default function BootstrapProvider() {
    useEffect(() => {
        import("bootstrap");
    }, []);

    return null;
}