import React from "react";
import { MapPin, Clock, Mail } from "lucide-react";

/**
 * Karta + besöksinformation. Google Maps-embed (kräver ingen API-nyckel).
 */
const VisitUs: React.FC = () => {
  return (
    <section className="py-20 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            Hitta till oss
          </h2>
          <p className="mt-2 text-base-content/70">
            Centralt i Stockholm — nära tunnelbana och parkering
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
          {/* Karta */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden ring-1 ring-base-300/60 shadow-sm min-h-[320px]">
            <iframe
              title="Karta till ElsaBeauty, Storgatan 15, Stockholm"
              src="https://maps.google.com/maps?q=Storgatan%2015%2C%20Stockholm&z=15&hl=sv&output=embed"
              className="w-full h-full min-h-[320px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Besöksinfo */}
          <div className="lg:col-span-2 card bg-base-100 ring-1 ring-base-300/60 shadow-sm">
            <div className="card-body gap-5">
              <div className="flex items-start gap-3">
                <span className="rounded-full p-2 bg-primary/10 text-primary ring-1 ring-primary/20 shrink-0">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold">Besöksadress</h3>
                  <p className="text-sm text-base-content/70">
                    Storgatan 15
                    <br />
                    123 45 Stockholm
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="rounded-full p-2 bg-primary/10 text-primary ring-1 ring-primary/20 shrink-0">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold">Öppettider</h3>
                  <ul className="text-sm text-base-content/70 space-y-0.5">
                    <li>Måndag–Fredag: 09:00–18:00</li>
                    <li>Lördag: 10:00–16:00</li>
                    <li>Söndag: Stängt</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="rounded-full p-2 bg-primary/10 text-primary ring-1 ring-primary/20 shrink-0">
                  <Mail className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold">Kontakt</h3>
                  <p className="text-sm text-base-content/70">
                    info@elsabeauty.se
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisitUs;
