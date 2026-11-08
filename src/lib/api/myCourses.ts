import { apiFetch } from "./client";
import type { CatalogState, MyCourse } from "./types";

export function getMyCourses(token: string): Promise<MyCourse[]> {
  return apiFetch<MyCourse[]>("/api/v1/me/courses", { token });
}

export function getCatalogState(token: string): Promise<CatalogState> {
  return apiFetch<CatalogState>("/api/v1/me/catalog-state", { token });
}
