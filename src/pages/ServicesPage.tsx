import React, { useMemo, useState } from "react";
import AdaptiveLayout from "@/components/layout/adaptive-layout";
import { Link } from "react-router-dom";
import { useServices } from "@/hooks/useServices";
import { Sparkles } from "lucide-react";
import ImageWithFallback from "@/components/ImageWithFallback";

const ServicesPage: React.FC = () => {
  const { services, error, loading } = useServices();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recommended");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = services.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q)
    );
    switch (sort) {
      case "price-asc":
        arr = [...arr].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price-desc":
        arr = [...arr].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "name-asc":
        arr = [...arr].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return arr;
  }, [services, query, sort]);

  return (
    <AdaptiveLayout>
      <section className="mb-10">
        <div className="rounded-2xl bg-gradient-to-br from-base-100 via-base-200 to-base-100 ring-1 ring-base-300/60 shadow-sm p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 md:justify-center">
              <span className="rounded-full p-2 bg-primary/10 text-primary ring-1 ring-primary/20">
                <Sparkles className="h-5 w-5" />
              </span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight md:text-center">
                Behandlingar
              </h1>
            </div>
            <p className="mt-2 text-base-content/70 md:text-center max-w-2xl mx-auto">
              Utforska vårt urval av behandlingar. Klicka för att läsa mer.
            </p>
            <div className="mt-4 md:mt-6 flex md:justify-center">
              <span className="badge badge-ghost">
                {filtered.length} behandlingar
              </span>
            </div>
            <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:justify-center max-w-3xl mx-auto">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sök behandling..."
                className="input input-bordered w-full"
              />
              <select
                className="select select-bordered md:w-60"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="recommended">Rekommenderat</option>
                <option value="price-asc">Pris: Låg till hög</option>
                <option value="price-desc">Pris: Hög till låg</option>
                <option value="name-asc">Namn A–Ö</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <section className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="card ring-1 ring-base-300/60 rounded-xl overflow-hidden"
            >
              <div className="skeleton w-full h-40 md:h-44" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="card group bg-base-100 ring-1 ring-base-300/60 shadow-sm rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-transform duration-200"
          >
            <figure className="relative aspect-[16/10] overflow-hidden">
              <ImageWithFallback
                src={s.imageUrl}
                alt={s.name}
                className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                fallbackText="Ingen bild"
              />
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent text-white">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <h3 className="font-semibold line-clamp-1">{s.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                    {s.price} kr
                  </span>
                </div>
              </div>
            </figure>
            <div className="card-body p-4">
              <p className="text-sm text-base-content/70 line-clamp-3">
                {s.description}
              </p>
              <div className="mt-3 flex justify-end">
                <Link
                  to={`/service/${s.id}`}
                  className="btn btn-primary btn-sm"
                >
                  Läs mer
                </Link>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !error && !loading && (
          <div className="col-span-full text-base-content/70">
            Inga behandlingar tillgängliga just nu.
          </div>
        )}
      </section>
    </AdaptiveLayout>
  );
};

export default ServicesPage;
