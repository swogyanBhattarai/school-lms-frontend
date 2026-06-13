import api from "@/lib/api";
import type {
  AttendanceModel,
  AttendanceResponse,
  MassAttendance,
  PerStudentAttendanceSummary,
} from "@/types/lms";

export type StudentAttendanceSummaryParams = {
  studentId: number;
  sectionId: number;
  subjectId?: number;
  fromDate?: string;
  toDate?: string;
};

/**
 * Fetch all attendance records
 */
export const getAllAttendance = async (): Promise<AttendanceModel[]> => {
  const response = await api.get("/api/attendance");
  return response.data;
};

/**
 * Fetch a single attendance record by ID
 */
export const getAttendanceById = async (id: number): Promise<AttendanceModel> => {
  const response = await api.get(`/api/attendance/${id}`);
  return response.data;
};

/**
 * Create a single attendance record
 */
export const createAttendance = async (
  payload: AttendanceModel
): Promise<AttendanceModel> => {
  const response = await api.post("/api/attendance", payload);
  return response.data;
};

/**
 * Create attendance records for a section and subject
 */
export const createMassAttendance = async (
  sectionId: number,
  subjectId: number,
  payload: MassAttendance
): Promise<string> => {
  const response = await api.post(
    `/api/attendance/section/${sectionId}/subject/${subjectId}`,
    payload
  );
  return response.data;
};

/**
 * Fetch attendance for a section and subject (today)
 */
export const getAttendanceBySectionAndSubject = async (
  sectionId: number,
  subjectId: number
): Promise<AttendanceResponse[]> => {
  const response = await api.get<AttendanceResponse[]>(
    `/api/attendance/section/${sectionId}/subject/${subjectId}`
  );
  return response.data;
};

/**
 * Fetch per-student attendance summary
 */
export const getStudentAttendanceSummary = async (
  params: StudentAttendanceSummaryParams
): Promise<PerStudentAttendanceSummary[]> => {
  const response = await api.get<PerStudentAttendanceSummary[]>(
    "/api/attendance/student-summary",
    { params }
  );
  return response.data;
};

/**
 * Fetch daily attendance for a student
 */
export const getStudentDailyAttendance = async (
  studentId: number,
  date: string
): Promise<AttendanceResponse[]> => {
  const response = await api.get<AttendanceResponse[]>(
    "/api/attendance/student-daily",
    { params: { studentId, date } }
  );
  return response.data;
};
