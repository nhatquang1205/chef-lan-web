/** The backend's ProblemDetails, as the API returns it for every failure. */
export interface ProblemDetails {
  status?: number;
  title?: string;
  detail?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: ProblemDetails,
    public readonly retryAfterSeconds?: number,
  ) {
    super(problem.detail ?? problem.title ?? `API error ${status}`);
  }

  get code() {
    return this.problem.code;
  }
}

/** Thrown when the API cannot be reached at all (as opposed to answering with an error). */
export class NetworkError extends Error {}

function baseUrl(): string {
  const url = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!url) {
    throw new Error("API_BASE_URL is not set. Copy .env.example to .env.local.");
  }

  return url.replace(/\/$/, "");
}

export interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new NetworkError("Could not reach the API.");
  }

  if (!response.ok) {
    let problem: ProblemDetails = {};

    try {
      problem = (await response.json()) as ProblemDetails;
    } catch {
      // Non-JSON error body (a proxy page, say): the status code is all we have.
    }

    const retryAfter = Number(response.headers.get("Retry-After"));
    throw new ApiError(response.status, problem, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}
