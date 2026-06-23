import api from "@/lib/api";
import type {
  FeePaymentCreate,
  StudentFeeCreate,
  StudentFeeResponse,
  FeeStatus,
} from "@/types/lms";

const BASE_URL = "/api/student-fee";

export const createStudentFee = async (
  studentId: number,
  academicYearId: number,
  data: StudentFeeCreate
): Promise<string> => {
  const res = await api.post<string>(`${BASE_URL}/${studentId}/${academicYearId}`, data);
  return res.data;
};

export const getAllByStudentId = async (studentId: number): Promise<StudentFeeResponse[]> => {
  const res = await api.get<StudentFeeResponse[]>(`${BASE_URL}/student/${studentId}`);
  return res.data;
};

export const getAllStudentFees = async (): Promise<StudentFeeResponse[]> => {
  const res = await api.get<StudentFeeResponse[]>(`${BASE_URL}/all`);
  return res.data;
};

export const getAllStudentFeesFiltered = async (
  studentId: number,
  academicYearId?: number,
  feeStatus?: FeeStatus
): Promise<StudentFeeResponse[]> => {
  const params: Record<string, string> = {};
  if (academicYearId !== undefined && academicYearId !== null) params.academicYearId = String(academicYearId);
  if (feeStatus) params.feeStatus = feeStatus;
  const res = await api.get<StudentFeeResponse[]>(`${BASE_URL}/dashboard/${studentId}`, { params });
  return res.data;
};

export const createFeePayment = async (
  studentFeeId: number,
  data: FeePaymentCreate
): Promise<string> => {
  const res = await api.post<string>(`${BASE_URL}/payment/${studentFeeId}`, data);
  return res.data;
};

export const updateStudentFee = async (
  studentFeeId: number,
  data: StudentFeeCreate
): Promise<string> => {
  const res = await api.put<string>(`${BASE_URL}/${studentFeeId}`, data);
  return res.data;
};

export const updateFeePayment = async (
  feePaymentId: number,
  data: FeePaymentCreate
): Promise<string> => {
  const res = await api.put<string>(`${BASE_URL}/payment/${feePaymentId}`, data);
  return res.data;
};

export const deleteStudentFee = async (studentFeeId: number): Promise<void> => {
  await api.delete(`${BASE_URL}/${studentFeeId}`);
};

export const deleteFeePayment = async (feePaymentId: number): Promise<void> => {
  await api.delete(`${BASE_URL}/payment/${feePaymentId}`);
};
