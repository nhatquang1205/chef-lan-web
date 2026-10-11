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

export interface CustomerAuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  customer: Customer;
}
