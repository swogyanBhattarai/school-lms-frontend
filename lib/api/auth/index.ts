import api from "@/lib/api";
import type { CurrentUserInfoResponse, UserLoginDTO } from "@/types/lms";

export const login = async (payload: UserLoginDTO) => {
  const response = await api.post<string>("/api/auth/login", payload);
  return response.data;
};

export const me = async () => {
  const response = await api.post<CurrentUserInfoResponse>("/api/auth/me");
  return response.data;
};
