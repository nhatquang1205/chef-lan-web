import { apiFetch } from "./client";
import type { MyCourse } from "./types";

export function getMyCourses(token: string): Promise<MyCourse[]> {
  return apiFetch<MyCourse[]>("/api/v1/me/courses", { token });
}
