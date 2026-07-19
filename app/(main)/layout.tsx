import Navbar from "@/app/components/navbar/navbar";
import Footer from "@/app/components/footer/footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="main">
            <Navbar />
            {children}
            <Footer />
        </div>
    );
}