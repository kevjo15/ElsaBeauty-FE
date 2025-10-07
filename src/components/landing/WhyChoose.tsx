import React from "react";
import { ShieldCheck, Heart, BadgeCheck, Sparkles } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Medicinsk säkerhet",
    desc: "Med legitimation som distriktssköterska och erfarenhet från vården kan du känna dig trygg. Jag följer hygienrutiner och arbetar enligt medicinska riktlinjer.",
  },
  {
    icon: Heart,
    title: "Personlig omtanke",
    desc: "Varje klient är unik. Jag lyssnar på dina önskemål och behov för att skapa en behandlingsplan som passar just dig.",
  },
  {
    icon: BadgeCheck,
    title: "Beprövade metoder",
    desc: "Endast certifierade produkter och metoder som är vetenskapligt beprövade och säkra.",
  },
  {
    icon: Sparkles,
    title: "Synliga resultat",
    desc: "Min kunskap om hud och vävnad ger behandlingar som skapar verkliga, långvariga resultat.",
  },
];

const WhyChoose: React.FC = () => {
  return (
    <section className="py-20 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Varför välja <span className="text-primary">ElsaBeauty</span>?
          </h2>
          <p className="mt-2 text-base-content/70">
            Medicinsk kompetens kombinerat med personlig omtanke
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="card bg-base-100 border border-base-300/60 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="card-body flex-row gap-4 items-start">
                  <div className="rounded-full p-3 bg-primary/10 text-primary ring-1 ring-primary/20 shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{f.title}</h3>
                    <p className="text-base-content/70">{f.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
