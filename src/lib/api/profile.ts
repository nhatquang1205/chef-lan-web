import { apiFetch } from "./client";
import type { Customer, Province } from "./types";

export function getProvinces(signal?: AbortSignal): Promise<Province[]> {
  return apiFetch<Province[]>("/api/v1/provinces", { signal });
}

export interface ProfileInput {
  fullName: string;
  phone: string;
  provinceCode: string;
}

export function updateProfile(token: string, input: ProfileInput): Promise<Customer> {
  return apiFetch<Customer>("/api/v1/me/profile", { method: "PUT", token, body: input });
}
