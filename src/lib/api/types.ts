// Hand-written on purpose: the backend's OpenAPI document types every int64 as
// `number | string`, which would force a cast at every use. Keep in step with
// ChefLan.Logic/**/Contracts. Enums travel as strings.

export type CourseLevel = "Unspecified" | "Beginner" | "Intermediate" | "Advanced";

export type CourseSort = "Newest" | "PriceAsc" | "PriceDesc" | "Title";

export interface Category {
  id: number;
  name: string;
  slug: string;
  thumbnailUrl?: string | null;
  displayOrder: number;
}

export interface CourseListItem {
  id: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  thumbnailUrl?: string | null;
  level: CourseLevel;
  publishedAt?: string | null;
  priceVnd: number;
  compareAtPriceVnd?: number | null;
  priceDisplay: string;
  lessonCount: number;
  totalDurationSeconds: number;
  accessDurationDays?: number | null;
  categories: Category[];
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface LessonVideoOutline {
  id: number;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  durationSeconds: number;
  isFree: boolean;
  freeTillSeconds?: number | null;
  /** Present only for free videos. */
  url?: string;
}

export interface LessonOutline {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  durationSeconds: number;
  videos: LessonVideoOutline[];
}

export interface CourseDetail extends Omit<CourseListItem, "categories"> {
  description?: string | null;
  whatYouWillLearn?: string | null;
  metaDescription?: string | null;
  promoVideoUrl?: string | null;
  categories: Category[];
  lessons: LessonOutline[];
}

export interface Customer {
  id: number;
  email: string | null;
  fullName: string;
  phone?: string | null;
}

/** An admin who signed in through the shared login (see the backend's CustomerAuthController). */
export interface Staff {
  id: number;
  email: string;
  displayName: string;
  role: "Admin" | "Staff";
  jobTitle?: string | null;
  mustChangePassword: boolean;
}

/**
 * Result of /auth/login and /auth/refresh. `actor` says which population the token belongs to;
 * exactly one of `customer` and `staff` is present. /auth/register returns the customer shape
 * without `actor`.
 */
export interface SessionResponse {
  actor?: "Customer" | "Staff";
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  customer?: Customer;
  staff?: Staff;
}
