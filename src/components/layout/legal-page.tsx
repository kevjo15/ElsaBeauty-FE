import React from "react";
import PublicLayout from "@/components/layout/public-layout";

/** Datum då de juridiska dokumenten senast ändrades. Uppdatera vid ändring. */
export const LEGAL_LAST_UPDATED = "6 juli 2026";

interface LegalPageProps {
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}

/** Gemensam läsvänlig ram för integritetspolicy och användarvillkor. */
const LegalPage: React.FC<LegalPageProps> = ({ title, intro, children }) => (
  <PublicLayout>
    <div className="container mx-auto px-4 py-12 md:py-16">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-base-content/60">
          Senast uppdaterad {LEGAL_LAST_UPDATED}
        </p>
        <div className="mt-6 text-base-content/80 leading-relaxed">{intro}</div>
        <div className="mt-10 space-y-10 text-base-content/80 leading-relaxed">
          {children}
        </div>
      </article>
    </div>
  </PublicLayout>
);

interface LegalSectionProps {
  heading: string;
  children: React.ReactNode;
}

export const LegalSection: React.FC<LegalSectionProps> = ({
  heading,
  children,
}) => (
  <section>
    <h2 className="text-xl font-semibold text-base-content">{heading}</h2>
    <div className="mt-3 space-y-3">{children}</div>
  </section>
);

/** Punktlista med enhetlig styling. */
export const LegalList: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;

export default LegalPage;
