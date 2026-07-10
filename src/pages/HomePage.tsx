import React from "react";
import { Link } from "react-router-dom";
import PublicLayout from "@/components/layout/public-layout";
import { Calendar, BadgeCheck, UserPlus, Star } from "lucide-react";
import AboutElsa from "@/components/landing/AboutElsa";
import WhyChoose from "@/components/landing/WhyChoose";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import VisitUs from "@/components/landing/VisitUs";
import CallToAction from "@/components/landing/CallToAction";
import ImageWithFallback from "@/components/ImageWithFallback";
import { useAuth } from "@/services/api/authContext";
import elsaHero from "@/assets/elsa-hero.webp";

const stats = [
  { value: "1 200+", label: "utförda behandlingar" },
  { value: "4,9 / 5", label: "i snittbetyg" },
  { value: "8+ år", label: "inom svensk sjukvård" },
  { value: "100 %", label: "legitimerad personal" },
];

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <PublicLayout>
      {/* Hero — gradient-wash i ljust läge; mörkt läge återgår till ren bas */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-base-100 to-accent/20 dark:bg-none">
        {/* Mjuk dekorativ bakgrund */}
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-[32rem] w-[32rem] rounded-full bg-primary/15 blur-3xl dark:h-96 dark:w-96 dark:bg-primary/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent/25 blur-3xl dark:h-80 dark:w-80 dark:bg-accent/15"
          aria-hidden="true"
        />

        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center py-14 md:py-20">
            <div className="text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 text-sm">
                <BadgeCheck className="h-4 w-4" />
                Legitimerad Distriktssköterska
              </div>
              <h1 className="font-display mt-5 text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight">
                Skönhetsvård med{" "}
                <span className="text-primary">medicinsk trygghet</span>
              </h1>
              <p className="mt-5 text-lg text-base-content/70 max-w-lg">
                Välkommen till ElsaBeauty. Jag är Elsa — legitimerad
                distriktssköterska som kombinerar vårdens noggrannhet med
                estetikens känsla. Naturliga resultat, alltid på dina villkor.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <>
                    <Link to="/bookings" className="btn btn-primary btn-lg">
                      <Calendar className="h-5 w-5" />
                      Boka behandling
                    </Link>
                    <Link to="/services" className="btn btn-ghost btn-lg">
                      Se behandlingar
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/register" className="btn btn-primary btn-lg">
                      <UserPlus className="h-5 w-5" />
                      Kom igång
                    </Link>
                    <Link to="/services" className="btn btn-ghost btn-lg">
                      Se behandlingar
                    </Link>
                  </>
                )}
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm text-base-content/70">
                <span
                  className="flex gap-0.5 text-warning"
                  aria-label="4,9 av 5 stjärnor"
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </span>
                4,9 av 5 från över 300 omdömen
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-primary/15 dark:shadow-xl ring-1 ring-base-300/60 bg-base-100">
                <ImageWithFallback
                  src={elsaHero}
                  alt="Elsa, legitimerad distriktssköterska och grundare av ElsaBeauty"
                  loading="eager"
                  width={1024}
                  height={1536}
                  className="w-full h-[360px] md:h-[520px] object-cover object-[50%_8%] md:object-[50%_0%] lg:object-[50%_10%]"
                  fallbackText="Bilden kunde inte laddas"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistikband */}
      <section className="border-y border-base-300/60 bg-base-200/70 dark:bg-base-200/50">
        <div className="container mx-auto px-4">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-2xl md:text-3xl font-semibold text-primary">
                  {stat.value}
                </dd>
                <p className="mt-1 text-sm text-base-content/70">{stat.label}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Om Elsa */}
      <AboutElsa />

      {/* Så funkar det */}
      <HowItWorks />

      {/* Varför välja oss */}
      <WhyChoose />

      {/* Omdömen */}
      <Testimonials />

      {/* Vanliga frågor */}
      <FAQ />

      {/* Karta & besöksinfo */}
      <VisitUs />

      {/* CTA */}
      <CallToAction />
    </PublicLayout>
  );
};

export default HomePage;
