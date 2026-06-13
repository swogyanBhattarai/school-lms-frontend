import axios, { AxiosError } from "axios";
import { redirectToLogin } from "./api/auth/utils";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const requestUrl = error.config?.url ?? "";
    const isLoginRequest = requestUrl.includes("/api/auth/login");

    if (!isLoginRequest && (error.response?.status === 401 || error.response?.status === 403)) {
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

export default api;
