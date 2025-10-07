import React from "react";
import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout";
import { Calendar, BadgeCheck } from "lucide-react";
import AboutElsa from "@/components/landing/AboutElsa";
import WhyChoose from "@/components/landing/WhyChoose";
import CallToAction from "@/components/landing/CallToAction";
import Footer from "@/components/layout/Footer";

const HomePage: React.FC = () => {
  return (
    <MainLayout>
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
              <Link to="/bookings" className="btn btn-primary">
                <Calendar className="h-4 w-4" />
                Boka konsultation
              </Link>
              <a href="#about" className="btn btn-secondary">
                Läs mer om mig
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-base-300/60 bg-base-100">
              <img
                src="http://127.0.0.1:10000/devstoreaccount1/homepage/Elsa2.png?se=2025-11-05T05%3A07%3A40Z&sig=nyKqAp5oJQZMmzX%2Bkv0vHajjWsED88M4LHAAj9TQt4M%3D&sp=rl&sr=c&sv=2018-03-28"
                alt="Elsa"
                className="w-full h-[360px] md:h-[500px] object-cover object-[50%_8%] md:object-[50%_0%] lg:object-[50%_10%]"
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
    </MainLayout>
  );
};

export default HomePage;
