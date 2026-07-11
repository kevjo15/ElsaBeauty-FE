import React from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sofia L.",
    treatment: "Läppfillers",
    quote:
      "Elsa tog sig verkligen tid att lyssna på vad jag ville ha. Resultatet blev naturligt och precis lagom — jag har redan bokat min nästa tid.",
  },
  {
    name: "Maria K.",
    treatment: "Botox Panna",
    quote:
      "Som förstagångskund var jag nervös, men Elsas medicinska bakgrund gjorde att jag kände mig trygg hela vägen. Proffsigt från start till mål.",
  },
  {
    name: "Johanna A.",
    treatment: "Microneedling",
    quote:
      "Bästa salongsupplevelsen jag haft. Noggrann konsultation, fin lokal och ett resultat som syns. Rekommenderar varmt!",
  },
];

const Stars: React.FC = () => (
  <div className="flex gap-0.5 text-warning" aria-label="5 av 5 stjärnor">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className="h-4 w-4 fill-current" />
    ))}
  </div>
);

const Testimonials: React.FC = () => {
  return (
    <section className="py-20 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            Vad våra kunder säger
          </h2>
          <p className="mt-2 text-base-content/70">
            Trygghet och resultat — med kundernas egna ord
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="card bg-base-100 ring-1 ring-base-300/60 shadow-sm"
            >
              <div className="card-body">
                <Stars />
                <blockquote className="mt-2 text-sm text-base-content/80 leading-relaxed">
                  ”{t.quote}”
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-primary/15 text-primary rounded-full w-9 ring-1 ring-primary/20">
                      <span className="text-sm font-semibold">
                        {t.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-base-content/60">{t.treatment}</p>
                  </div>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
