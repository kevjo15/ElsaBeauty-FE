import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Mail, Clock } from "lucide-react";
import Logo from "@/components/Logo";

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-base-100 border-t border-base-300/60">
      <div className="container mx-auto px-4">
        {/* Thinner footer with 4 columns */}
        <div className="py-4 grid grid-cols-1 md:grid-cols-4 gap-6 text-base-content text-sm">
          {/* Brand/intro */}
          <div>
            <Logo markSize={24} />
            <p className="mt-2 text-base-content/70 max-w-sm">
              Medicinsk hudvård med omtanke. Legitimerad distriktssköterska med
              flera års erfarenhet.
            </p>
          </div>

          {/* Address */}
          <div>
            <h6 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span className="rounded-full p-1.5 bg-primary/10 text-primary ring-1 ring-primary/20">
                <MapPin className="h-4 w-4" />
              </span>
              Besöksadress
            </h6>
            <p>Storgatan 15</p>
            <p>123 45 Stockholm</p>
          </div>

          {/* E-post column (placed next to address to reduce height) */}
          <div>
            <h6 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary/80" />
              E-post
            </h6>
            <p>info@elsabeauty.se</p>
          </div>

          {/* Opening hours */}
          <div>
            <h6 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span className="rounded-full p-1.5 bg-primary/10 text-primary ring-1 ring-primary/20">
                <Clock className="h-4 w-4" />
              </span>
              Öppettider
            </h6>
            <div className="space-y-1">
              <p>Måndag - Fredag: 09:00 - 18:00</p>
              <p>Lördag: 10:00 - 16:00</p>
              <p>Söndag: Stängt</p>
            </div>
          </div>
        </div>

        {/* Bottom line thinner */}
        <div className="py-2 border-t border-base-300/60 flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-base-content/60">
          <span>
            © {new Date().getFullYear()} ElsaBeauty. Alla rättigheter förbehållna.
          </span>
          <span className="flex items-center gap-3">
            <Link to="/privacy" className="link link-hover">
              Integritetspolicy
            </Link>
            <Link to="/terms" className="link link-hover">
              Användarvillkor
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
