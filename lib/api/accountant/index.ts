import api from "@/lib/api";
import type {
  AccountantResponse,
  AccountantCreate,
  AccountantUpdate,
} from "@/types/lms";

export const getAllAccountants = async (): Promise<AccountantResponse[]> => {
  const response = await api.get<AccountantResponse[]>("/api/accountant");
  return response.data;
};

export const getAccountantById = async (id: number): Promise<AccountantResponse> => {
  const response = await api.get<AccountantResponse>(`/api/accountant/${id}`);
  return response.data;
};

export const createAccountant = async (payload: AccountantCreate): Promise<string> => {
  const response = await api.post<string>("/api/accountant", payload);
  return response.data;
};

export const updateAccountant = async (
  id: number,
  payload: AccountantUpdate
): Promise<string> => {
  const response = await api.put<string>(`/api/accountant/${id}`, payload);
  return response.data;
};

export const deleteAccountant = async (id: number): Promise<void> => {
  await api.delete(`/api/accountant/${id}`);
};
