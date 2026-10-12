import { apiFetch } from "./client";
import type { CourseListItem, MyCourse, Paged } from "./types";

/**
 * MOCK until the backend has GET /api/v1/me/courses (customer token, owned courses and courses
 * with individually bought lessons, newest enrolment first). Replace the body with
 * `apiFetch<MyCourse[]>("/api/v1/me/courses", { token })`.
 */
export async function getMyCourses(): Promise<MyCourse[]> {
  const { items } = await apiFetch<Paged<CourseListItem>>("/api/v1/courses?pageSize=3");

  return items.map((course, index) => ({
    ...course,
    enrolledAt: new Date(Date.now() - index * 7 * 86_400_000).toISOString(),
    accessType: index === 2 ? "Lessons" : "Course",
    ownedLessonCount: index === 2 ? 2 : course.lessonCount,
  }));
}
