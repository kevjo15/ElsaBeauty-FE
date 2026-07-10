import { api } from "./apiService";
import { GET_ALL_SERVICES_URL } from "./apiUrl";
import { Service, ServiceInput } from "./types";

export const getAllServices = async (): Promise<Service[]> => {
  try {
    const response = await api.get<Service[]>(GET_ALL_SERVICES_URL);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return [];
  }
};

// Admin-CRUD. Fel kastas vidare så formuläret kan visa API:ts meddelande.
// OBS: POST/PUT-svaren innehåller rå blob-path i imageUrl — hämta om listan
// via getAllServices efter mutationer istället för att använda svaret.

export async function createService(input: ServiceInput): Promise<Service> {
  const res = await api.post<Service>(GET_ALL_SERVICES_URL, input);
  return res.data;
}

export async function updateService(
  id: string,
  input: ServiceInput
): Promise<void> {
  await api.put(`${GET_ALL_SERVICES_URL}/${id}`, input);
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`${GET_ALL_SERVICES_URL}/${id}`);
}

/** Laddar upp behandlingsbild (multipart, max 5 MB, jpg/png/webp). */
export async function uploadServiceImage(
  serviceId: string,
  file: File
): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  await api.post(`${GET_ALL_SERVICES_URL}/${serviceId}/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
