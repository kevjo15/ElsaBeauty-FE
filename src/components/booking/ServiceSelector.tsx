import React from "react";
import { type Service } from "@/services/api";
import { Clock } from "lucide-react";

interface ServiceSelectorProps {
  services: Service[];
  selectedService: Service | null;
  onServiceChange: (serviceId: string) => void;
  title: string;
}

// Hjälpfunktion för att formatera TimeSpan till minuter
const formatDuration = (duration: string): string => {
  const parts = duration.split(":");
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  if (hours > 0) {
    return `${hours} h ${minutes} min`;
  }
  return `${minutes} min`;
};

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedService,
  onServiceChange,
  title,
}) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body items-center p-6">
        <h2 className="card-title text-center text-2xl font-bold">{title}</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Upptäck våra professionella skönhetsbehandlingar
        </p>
        <div className="space-y-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className={`card bg-base-200 shadow-md cursor-pointer transition-all duration-200 ease-in-out ${
                  selectedService?.id === service.id
                    ? "border-2 border-primary shadow-lg scale-[1.02]"
                    : "border border-base-300 hover:shadow-lg hover:scale-[1.01]"
                }`}
                onClick={() => onServiceChange(service.id)}
              >
                <figure className="h-56 w-full overflow-hidden">
                  <img
                    src={service.imageUrl}
                    alt={service.name}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                </figure>
                <div className="card-body p-4">
                  <h3 className="card-title text-lg">{service.name}</h3>
                  <p className="text-sm text-base-content">
                    {service.description}
                  </p>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDuration(service.duration)}
                    </span>
                    <span className="font-bold text-primary">
                      {service.price} kr
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceSelector;
