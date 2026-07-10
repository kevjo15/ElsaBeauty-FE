import React from "react";
import { Link } from "react-router-dom";

const CallToAction: React.FC = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl rounded-2xl bg-gradient-to-b from-primary/10 via-base-100 to-secondary/10 shadow-lg border border-base-300/50">
          <div className="p-10 text-center">
            <h3 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
              Redo att börja din hudvårdsresa?
            </h3>
            <p className="mt-2 text-base-content/70 max-w-2xl mx-auto">
              Boka en kostnadsfri konsultation så går vi igenom dina behov och
              skapar en skräddarsydd behandlingsplan tillsammans.
            </p>
            <div className="mt-6">
              <Link to="/bookings" className="btn btn-primary btn-lg">
                Boka konsultation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
