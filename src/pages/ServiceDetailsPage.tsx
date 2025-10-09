import React, { useMemo, useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import { useParams, Link } from "react-router-dom";
import { useServicesWithImages } from "@/hooks/useServicesWithImages";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Tag,
  CheckCircle2,
  Info,
  Zap,
  LifeBuoy,
  HelpCircle,
} from "lucide-react";

const ServiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { services, error } = useServicesWithImages();

  const service = useMemo(
    () => services.find((s) => s.id === id),
    [services, id]
  );
  const [tab, setTab] = useState<"about" | "result" | "aftercare" | "faq">(
    "about"
  );

  // Format duration strings to a friendly "X h Y min" form
  const formatDuration = (value: string) => {
    if (!value) return "";
    // HH:MM or HH:MM:SS
    const hhmmss = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (hhmmss) {
      const h = parseInt(hhmmss[1], 10);
      const m = parseInt(hhmmss[2], 10);
      const parts: string[] = [];
      if (h > 0) parts.push(`${h} h`);
      if (m > 0) parts.push(`${m} min`);
      return parts.join(" ") || "0 min";
    }
    // ISO 8601: PT#H#M#S
    const iso = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
    if (iso) {
      const h = parseInt(iso[1] || "0", 10);
      const m = parseInt(iso[2] || "0", 10);
      const parts: string[] = [];
      if (h > 0) parts.push(`${h} h`);
      if (m > 0) parts.push(`${m} min`);
      return parts.join(" ") || "0 min";
    }
    // Numeric minutes
    const num = parseInt(value, 10);
    if (!isNaN(num)) return `${num} min`;
    return value;
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4">
        <div className="mb-4 max-w-6xl mx-auto">
          <Link to="/services" className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till behandlingar
          </Link>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        {!service && !error ? (
          <div className="skeleton h-64 w-full" />
        ) : !service ? (
          <div className="alert">
            <span>Behandling kunde inte hittas.</span>
          </div>
        ) : (
          <article className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Media */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl overflow-hidden ring-1 ring-base-300/60 shadow">
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="w-full h-[320px] md:h-[520px] object-cover object-center"
                />
              </div>
            </div>

            {/* Details/CTA */}
            <div className="lg:col-span-5">
              <div className="card bg-base-100 ring-1 ring-base-300/60 shadow-sm lg:sticky lg:top-20">
                <div className="card-body">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {service.name}
                  </h1>

                  <p className="text-base-content/70">{service.description}</p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full p-1.5 bg-primary/10 text-primary ring-1 ring-primary/20">
                        <Tag className="h-4 w-4" />
                      </span>
                      <span className="font-semibold">{service.price} kr</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full p-1.5 bg-primary/10 text-primary ring-1 ring-primary/20">
                        <Clock className="h-4 w-4" />
                      </span>
                      <span className="text-base-content/80">
                        {formatDuration(service.duration)}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-4" />

                  {/* Placeholder benefits – funkar bra även när mer text läggs till senare */}
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>Skonsam och effektiv behandling</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>Utförs av legitimerad personal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>Individanpassad plan efter dina mål</span>
                    </li>
                  </ul>

                  <div className="mt-6 flex gap-3">
                    <Link
                      to="/bookings"
                      state={{
                        preselectedServiceId: service.id,
                        startAtStep: 2,
                      }}
                      className="btn btn-primary"
                    >
                      <Calendar className="h-4 w-4" />
                      Boka tid
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )}
        <section className="max-w-6xl mx-auto mt-10">
          <div role="tablist" className="tabs tabs-lifted gap-1 flex-wrap">
            <button
              role="tab"
              className={`tab flex items-center gap-2 ${
                tab === "about" ? "tab-active" : ""
              }`}
              onClick={() => setTab("about")}
              aria-selected={tab === "about"}
            >
              <Info className="h-4 w-4" />
              Om behandlingen
            </button>
            <button
              role="tab"
              className={`tab flex items-center gap-2 ${
                tab === "result" ? "tab-active" : ""
              }`}
              onClick={() => setTab("result")}
              aria-selected={tab === "result"}
            >
              <Zap className="h-4 w-4" />
              Resultat & hållbarhet
            </button>
            <button
              role="tab"
              className={`tab flex items-center gap-2 ${
                tab === "aftercare" ? "tab-active" : ""
              }`}
              onClick={() => setTab("aftercare")}
              aria-selected={tab === "aftercare"}
            >
              <LifeBuoy className="h-4 w-4" />
              Eftervård
            </button>
            <button
              role="tab"
              className={`tab flex items-center gap-2 ${
                tab === "faq" ? "tab-active" : ""
              }`}
              onClick={() => setTab("faq")}
              aria-selected={tab === "faq"}
            >
              <HelpCircle className="h-4 w-4" />
              Vanliga frågor
            </button>
          </div>

          <div className="p-8 border border-base-300 bg-base-100 rounded-lg shadow-sm mt-4">
            {tab === "about" && (
              <div className="prose max-w-none">
                <p className="text-lg text-base-content/80 leading-relaxed mb-4">
                  {service?.description}
                </p>
                <p>
                  Behandlingen anpassas alltid efter dina mål och utgår från
                  medicinsk kompetens och beprövade metoder för ett tryggt och
                  snyggt resultat.
                </p>
              </div>
            )}

            {tab === "result" && (
              <ul className="space-y-2">
                <li>Synligt resultat kort efter behandlingen.</li>
                <li>Hållbarheten påverkas av hudtyp, område och livsstil.</li>
                <li>
                  Uppföljning kan rekommenderas för optimalt och jämnt resultat.
                </li>
              </ul>
            )}

            {tab === "aftercare" && (
              <ol className="list-decimal ml-5 space-y-2">
                <li>Undvik träning, bastu och varma bad samma dag.</li>
                <li>Följ givna hygien- och återfuktningsråd.</li>
                <li>Kontakta oss vid frågor eller oväntade reaktioner.</li>
              </ol>
            )}

            {tab === "faq" && (
              <div className="space-y-3">
                <details className="collapse collapse-arrow bg-base-100 border border-base-300">
                  <summary className="collapse-title font-medium">
                    Gör behandlingen ont?
                  </summary>
                  <div className="collapse-content text-sm text-base-content/70">
                    De flesta upplever obehaget som mild till måttlig nivå. Vid
                    behov kan lokalbedövning användas.
                  </div>
                </details>
                <details className="collapse collapse-arrow bg-base-100 border border-base-300">
                  <summary className="collapse-title font-medium">
                    När ser jag resultat?
                  </summary>
                  <div className="collapse-content text-sm text-base-content/70">
                    Ofta direkt eller inom några dagar, beroende på
                    behandlingstyp och område.
                  </div>
                </details>
              </div>
            )}
          </div>
        </section>

        {services.filter((x) => x.id !== id).slice(0, 3).length > 0 && (
          <section className="max-w-6xl mx-auto mt-10">
            <h2 className="text-xl font-semibold mb-3">
              Relaterade behandlingar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {services
                .filter((x) => x.id !== id)
                .slice(0, 3)
                .map((r) => (
                  <Link
                    key={r.id}
                    to={`/service/${r.id}`}
                    className="card bg-base-100 ring-1 ring-base-300/60 hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <figure className="aspect-[16/10] overflow-hidden">
                      <img
                        src={r.imageUrl}
                        alt={r.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </figure>
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium line-clamp-1">
                          {r.name}
                        </span>
                        <span className="text-sm text-base-content/70">
                          {r.price} kr
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  );
};

export default ServiceDetailsPage;
