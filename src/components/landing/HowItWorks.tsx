import React from "react";
import { Link } from "react-router-dom";
import { Search, CalendarCheck, Smile } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Välj behandling",
    desc: "Utforska utbudet och läs om resultat, hållbarhet och eftervård för varje behandling.",
  },
  {
    icon: CalendarCheck,
    title: "Boka din tid",
    desc: "Välj en tid som passar dig direkt i onlinebokningen — du får bekräftelse på en gång.",
  },
  {
    icon: Smile,
    title: "Kom och bli ompysslad",
    desc: "Vi börjar alltid med en kort konsultation så att behandlingen anpassas efter just dig.",
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section className="py-20 bg-base-200/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            Så funkar det
          </h2>
          <p className="mt-2 text-base-content/70">
            Från nyfiken till bokad på under en minut
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative card bg-base-100 ring-1 ring-base-300/60 shadow-sm"
              >
                <div className="card-body items-center text-center">
                  <span
                    className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-content text-sm font-bold shadow"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="mt-2 rounded-full p-3 bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                  <p className="text-sm text-base-content/70">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link to="/services" className="btn btn-outline btn-primary">
            Se alla behandlingar
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
