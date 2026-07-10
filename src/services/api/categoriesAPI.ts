import { api } from "./apiService";
import {
  GET_ALL_CATEGORIES_URL,
  GET_CATEGORIES_WITH_SERVICES_URL,
} from "./apiUrl";
import { Category, CategoryWithServices } from "./types";

export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const response = await api.get<Category[]>(GET_ALL_CATEGORIES_URL);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
};

export const getCategoriesWithServices = async (): Promise<
  CategoryWithServices[]
> => {
  try {
    const response = await api.get<CategoryWithServices[]>(
      GET_CATEGORIES_WITH_SERVICES_URL
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch categories with services:", error);
    return [];
  }
};

// Admin: kategorihantering. Fel kastas vidare till anroparen.

export async function createCategory(name: string): Promise<void> {
  // Skapa-endpointen tar fältet "categoryName" (PUT tar "name").
  await api.post(GET_ALL_CATEGORIES_URL, { categoryName: name });
}

/** Kopplar en behandling till en kategori (sätter service.CategoryId). */
export async function linkServiceToCategory(
  categoryId: string,
  serviceId: string
): Promise<void> {
  await api.post(`${GET_ALL_CATEGORIES_URL}/${categoryId}/services/${serviceId}`);
}

export async function unlinkServiceFromCategory(
  categoryId: string,
  serviceId: string
): Promise<void> {
  await api.delete(
    `${GET_ALL_CATEGORIES_URL}/${categoryId}/services/${serviceId}`
  );
}
