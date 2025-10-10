import { useState, useEffect } from "react";
import { getAllServicesWithSas, type Service } from "@/services/api";

export const useServicesWithImages = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await getAllServicesWithSas();
        setServices(servicesData);
      } catch (error) {
        console.error("Error fetching services with images:", error);
        setError(
          "Failed to load services with images. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, error, loading };
};
