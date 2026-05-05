import React from "react";
import { Link } from "react-router-dom";
import PublicLayout from "@/components/layout/public-layout";
import { Calendar, BadgeCheck, UserPlus } from "lucide-react";
import AboutElsa from "@/components/landing/AboutElsa";
import WhyChoose from "@/components/landing/WhyChoose";
import CallToAction from "@/components/landing/CallToAction";
import Footer from "@/components/layout/Footer";
import ImageWithFallback from "@/components/ImageWithFallback";
import { useAuth } from "@/services/api/authContext";

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const STORAGE_BASE_URL = import.meta.env.VITE_STORAGE_BASE_URL;

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-base-100 via-base-200 to-base-100 ring-1 ring-base-300/60 shadow-sm mb-16">
        <div className="grid md:grid-cols-2 gap-8 items-center p-8 md:p-12">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 text-sm">
              <BadgeCheck className="h-4 w-4" />
              Legitimerad Distriktssköterska
            </div>
            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Professionell hudvård med{" "}
              <span className="text-primary">medicinsk expertis</span>
            </h1>
            <p className="mt-4 text-base-content/70">
              Välkommen till ElsaBeauty, där medicinsk kompetens möter
              skönhetsvård. Jag är Elsa, legitimerad distriktssköterska med
              flera års erfarenhet.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <>
                  <Link to="/bookings" className="btn btn-primary">
                    <Calendar className="h-4 w-4" />
                    Boka konsultation
                  </Link>
                  <Link to="/dashboard" className="btn btn-secondary">
                    Till Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary">
                    <UserPlus className="h-4 w-4" />
                    Kom igång
                  </Link>
                  <Link to="/login" className="btn btn-secondary">
                    Logga in
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-base-300/60 bg-base-100">
              <ImageWithFallback
                src={`${STORAGE_BASE_URL}/homepage/Elsa2.png`}
                alt="Elsa"
                loading="eager"
                className="w-full h-[360px] md:h-[500px] object-cover object-[50%_8%] md:object-[50%_0%] lg:object-[50%_10%]"
                fallbackText="Bilden kunde inte laddas"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Elsa Section */}
      <AboutElsa />
      <WhyChoose />
      <CallToAction />

      {/* Footer */}
      <Footer />
    </PublicLayout>
  );
};

export default HomePage;
