import React from "react";
import { Service } from "@/services/api/apiService";
interface ServiceSelectorProps {
  services: Service[];
  selectedService: Service | null;
  onServiceChange: (serviceId: string) => void;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedService,
  onServiceChange,
}) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Select Service</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="service" className="label">
              Service
            </label>
            <select
              id="service"
              className="select select-bordered w-full"
              value={selectedService?.id || ""}
              onChange={(e) => onServiceChange(e.target.value)}
            >
              <option value="" disabled>
                Select a service
              </option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - {service.price} kr
                </option>
              ))}
            </select>
          </div>

          {selectedService && (
            <div className="p-4 border rounded-md bg-base-200">
              <h3 className="font-medium">{selectedService.name}</h3>
              <p className="text-sm text-base-content mt-1">
                {selectedService.description}
              </p>
              <div className="flex justify-between mt-2 text-sm">
                <span>Duration: {selectedService.duration}</span>
                <span>Price: {selectedService.price} kr</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceSelector;
