import React from "react";
import { BadgeCheck, ShieldCheck, Heart } from "lucide-react";

const perks = [
  {
    icon: BadgeCheck,
    title: "Legitimerad Distriktssköterska",
    desc: "Medicinsk kompetens och professionell vård",
  },
  {
    icon: ShieldCheck,
    title: "Flera års erfarenhet",
    desc: "Gedigen bakgrund från svensk sjukvård",
  },
  {
    icon: Heart,
    title: "Certifierade behandlingar",
    desc: "Säkra och beprövade metoder",
  },
];

const AboutElsa: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            Om Elsa
          </h2>
          <p className="mt-2 text-base-content/70">
            Din trygghet och resultat är mitt främsta fokus
          </p>
        </div>

        {/* About card */}
        <div className="mt-8 max-w-3xl mx-auto card bg-base-100 shadow-lg ring-1 ring-base-300/60">
          <div className="card-body">
            <p>
              Som legitimerad distriktssköterska med flera års erfarenhet från
              svensk sjukvård har jag en gedigen medicinsk grund som jag
              kombinerar med min passion för hudvård och estetiska behandlingar.
            </p>
            <p className="mt-4">
              Min bakgrund från vården innebär att jag arbetar med högsta
              säkerhet och professionalism. Jag tar mig tid att förstå varje
              klients unika behov och skapar skräddarsydda behandlingsplaner
              baserade på både medicinsk kunskap och beprövade metoder.
            </p>
            <p className="mt-4">
              På ElsaBeauty får du en trygg och professionell upplevelse där din
              hälsa och välmående alltid kommer först.
            </p>
          </div>
        </div>

        {/* Three perk cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {perks.map((perk, i) => {
            const Icon = perk.icon;
            return (
              <div
                key={i}
                className="card bg-base-100 shadow-md ring-1 ring-base-300/60 hover:shadow-lg transition-shadow"
              >
                <div className="card-body items-center text-center space-y-2">
                  <div className="rounded-full p-3 bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">{perk.title}</h3>
                  <p className="text-sm text-base-content/70">{perk.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AboutElsa;
