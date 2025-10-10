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
