import { api } from "./apiService";
import {
  GET_ALL_SERVICES_URL,
  GET_ALL_SERVICES_WITH_SAS_URL,
} from "./apiUrl";
import { Service } from "./types";

export const getAllServices = async (): Promise<Service[]> => {
  try {
    const response = await api.get<Service[]>(GET_ALL_SERVICES_URL);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return [];
  }
};

export const getAllServicesWithSas = async (): Promise<Service[]> => {
  try {
    const response = await api.get<Service[]>(GET_ALL_SERVICES_WITH_SAS_URL);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch services with SAS:", error);
    return [];
  }
};
