import api from "@/lib/api";
import type {
  FeePaymentCreate,
  FeeStatResponse,
  FeeTypeStatResponse,
  OverdueStudentResponse,
  StudentFeeCreate,
  StudentFeeResponse,
  SummaryFeeStats,
  FeeStatus,
  FeeTypes,
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

export const getFeeStats = async (
  feeStatus?: FeeStatus,
  classId?: number,
  sectionId?: number,
): Promise<FeeStatResponse> => {
  const params: Record<string, string> = {};
  if (feeStatus) params.feeStatus = feeStatus;
  if (classId !== undefined && classId !== null) params.classId = String(classId);
  if (sectionId !== undefined && sectionId !== null) params.sectionId = String(sectionId);
  const res = await api.get<FeeStatResponse>(`${BASE_URL}/admin/stats`, { params });
  return res.data;
};

export const getClassFeeStat = async (
  feeStatus?: FeeStatus,
  classId?: number,
  sectionId?: number,
): Promise<SummaryFeeStats[]> => {
  const params: Record<string, string> = {};
  if (feeStatus) params.feeStatus = feeStatus;
  if (classId !== undefined && classId !== null) params.classId = String(classId);
  if (sectionId !== undefined && sectionId !== null) params.sectionId = String(sectionId);
  const res = await api.get<SummaryFeeStats[]>(`${BASE_URL}/admin/stats/class`, { params });
  return res.data;
};

export const getOverdueStudents = async (
  feeType?: FeeTypes,
  classId?: number,
  sectionId?: number,
): Promise<OverdueStudentResponse[]> => {
  const params: Record<string, string> = {};
  if (feeType) params.feeType = feeType;
  if (classId !== undefined && classId !== null) params.classId = String(classId);
  if (sectionId !== undefined && sectionId !== null) params.sectionId = String(sectionId);
  const res = await api.get<OverdueStudentResponse[]>(`${BASE_URL}/admin/stats/overdue`, { params });
  return res.data;
};

export const getFeeTypeStats = async (
  classId?: number,
  sectionId?: number,
): Promise<FeeTypeStatResponse[]> => {
  const params: Record<string, string> = {};
  if (classId !== undefined && classId !== null) params.classId = String(classId);
  if (sectionId !== undefined && sectionId !== null) params.sectionId = String(sectionId);
  const res = await api.get<FeeTypeStatResponse[]>(`${BASE_URL}/admin/stats/types`, { params });
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
