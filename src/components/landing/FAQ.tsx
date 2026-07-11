import React from "react";

const faqs = [
  {
    q: "Är behandlingarna säkra?",
    a: "Ja. Alla behandlingar utförs av legitimerad distriktssköterska med medicinsk utbildning, enligt strikta hygienrutiner och med certifierade, spårbara produkter. Vi börjar alltid med en konsultation där vi går igenom din hälsohistorik.",
  },
  {
    q: "Gör behandlingarna ont?",
    a: "De flesta upplever endast ett milt obehag. Vid behov använder vi bedövningskräm, och vi anpassar alltid tempot efter dig. Du är i trygga händer hela vägen.",
  },
  {
    q: "Hur bokar jag en tid?",
    a: "Du bokar direkt här på sidan: välj behandling, plocka en ledig tid i kalendern och bekräfta. Du får en bokningsbekräftelse direkt och kan följa dina bokningar på Mina sidor.",
  },
  {
    q: "Kan jag avboka eller omboka?",
    a: "Ja, du kan avboka kostnadsfritt fram tills behandlingen har startat, direkt från dina bokningar på Mina sidor. Behöver du en annan tid är det bara att boka en ny.",
  },
  {
    q: "Hur länge håller resultatet?",
    a: "Det varierar med behandling och individ. Fillers håller vanligtvis 6–18 månader och botox 3–4 månader. Vid konsultationen får du en tydlig bild av vad du kan förvänta dig.",
  },
];

const FAQ: React.FC = () => {
  return (
    <section className="py-20 bg-base-200/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            Vanliga frågor
          </h2>
          <p className="mt-2 text-base-content/70">
            Svar på det våra kunder oftast undrar över
          </p>
        </div>

        <div className="mt-10 max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={faq.q}
              className="collapse collapse-arrow bg-base-100 ring-1 ring-base-300/60"
              open={i === 0}
            >
              <summary className="collapse-title font-medium">{faq.q}</summary>
              <div className="collapse-content text-sm text-base-content/70">
                <p>{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
