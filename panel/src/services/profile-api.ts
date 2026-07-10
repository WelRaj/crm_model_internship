import { api } from "@/lib/api-client";
import type { AuthUser } from "@/services/auth-api";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type BackendUserProfile = {
  id: string;
  user: AuthUser;
  profile_photo_file_id: string | null;
  reporting_manager: number | null;
  date_of_joining: string | null;
  office_location: string;
  employment_type: string;
  employee_status: string;
  emergency_contact_name: string;
  emergency_contact_mobile: string;
  address: string;
};

export type UpdateCurrentProfilePayload = {
  first_name?: string;
  last_name?: string;
  mobile?: string;
  designation?: string;
  department?: string;
  date_of_joining?: string | null;
  office_location?: string;
  employment_type?: string;
  employee_status?: string;
};

export async function getCurrentProfile() {
  const response = await api.get<ApiResponse<BackendUserProfile>>("/profile/me/");
  return response.data;
}

export async function updateCurrentProfile(payload: UpdateCurrentProfilePayload) {
  const response = await api.put<ApiResponse<BackendUserProfile>>("/profile/me/", payload);
  return response.data;
}
