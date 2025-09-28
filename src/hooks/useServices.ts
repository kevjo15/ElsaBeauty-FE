import { useState, useEffect } from "react";
import { Service, getAllServices } from "@/services/api/apiService";

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await getAllServices();
        setServices(servicesData);
      } catch (error) {
        console.error("Error fetching services:", error);
        setError("Failed to load services. Please try again later.");
      }
    };

    fetchServices();
  }, []);

  return { services, error };
};
