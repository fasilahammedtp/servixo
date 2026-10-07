import { api } from "./api";
import { Category } from "../types";

export async function getCategories(): Promise<Category[]> {
  const res = await api.get<{ categories: Category[] }>("/categories");
  return res.data.categories;
}
