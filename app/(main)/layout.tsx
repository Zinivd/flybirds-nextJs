import { Suspense } from "react";
import Navbar from "@/app/components/navbar/navbar";
import Footer from "@/app/components/footer/footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="main">
            <Suspense fallback={null}>
                <Navbar />
            </Suspense>
            {children}
            <Footer />
        </div>
    );
}