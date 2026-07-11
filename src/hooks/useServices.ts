import { useState, useEffect } from "react";
import { getAllServices, type Service } from "@/services/api";

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await getAllServices();
        setServices(servicesData);
      } catch (error) {
        console.error("Error fetching services:", error);
        setError("Kunde inte ladda behandlingarna. Försök igen senare.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, error, loading };
};
