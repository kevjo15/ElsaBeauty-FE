import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BadgeCheck, ShieldCheck } from "lucide-react";
import ModeToggle from "@/components/mode-toggle";
import Logo from "@/components/Logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Delad layout för inloggning/registrering: varumärkespanel till vänster
 * (desktop) och formulärytan till höger.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-svh grid lg:grid-cols-2">
      {/* Varumärkespanel (desktop) */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-primary text-primary-content p-10">
        {/* Mjuka ljusfläckar */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary-content/10 blur-3xl"
          aria-hidden="true"
        />
        {/* Stort ros-märke som vattenstämpel */}
        <svg
          viewBox="0 0 64 64"
          className="pointer-events-none absolute -bottom-16 -right-16 h-96 w-96 opacity-10"
          aria-hidden="true"
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M32 17 a15 15 0 1 0 15 15" />
            <path d="M32 24.5 a7.5 7.5 0 1 1 -7.5 7.5" />
            <path d="M32 29.5 a2.6 2.6 0 1 0 2.6 2.6" />
          </g>
        </svg>

        <Link to="/" className="relative inline-flex w-fit" aria-label="Till startsidan">
          <Logo variant="light" markSize={34} />
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight">
            Skönhetsvård med medicinsk trygghet.
          </h2>
          <p className="mt-4 text-primary-content/80">
            Boka fillers, botox och microneedling hos legitimerad
            distriktssköterska — naturliga resultat, alltid på dina villkor.
          </p>
        </div>

        <div className="relative flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-content/80">
          <span className="inline-flex items-center gap-2">
            <BadgeCheck className="h-4 w-4" />
            Legitimerad distriktssköterska
          </span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Certifierade produkter
          </span>
        </div>
      </aside>

      {/* Formulärsida — subtil gradient i ljust läge, ren bas i mörkt */}
      <main className="flex flex-col p-4 md:p-8 bg-gradient-to-b from-base-200/60 via-base-100 to-base-200/40 dark:bg-none">
        <div className="flex items-center justify-between">
          <Link to="/" className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" />
            Till startsidan
          </Link>
          <ModeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md">
            {/* Logga på mobil, där panelen är dold */}
            <div className="lg:hidden mb-8 flex justify-center">
              <Link to="/" aria-label="Till startsidan">
                <Logo markSize={34} />
              </Link>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
