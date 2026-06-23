// --- ClassAssignment DTOs ---
export type TeacherRoles = 'CLASS_TEACHER' | 'SUBJECT_TEACHER' | 'ASSISTANT_TEACHER';

export interface ClassAssignmentCreate {
  teacherId: number;
  teacherRole: TeacherRoles;
  subjectId: number;
  sectionId: number;
}

export interface ClassAssignmentUpdate {
  teacherId: number;
  teacherRole: TeacherRoles;
  subjectId: number;
  sectionId: number;
}

export interface ClassAssignmentResponse {
  classAssignmentId: number;
  teacherId: number;
  teacherName: string;
  teacherRole: TeacherRoles;
  subjectId: number;
  subjectName: string;
}

export interface ClassAssignmentAttendanceResponse {
  classAssignmentId: number;
  sectionId: number;
  subjectId: number;
  teacherName: string;
  teacherRole: TeacherRoles;
  subjectName: string;
  sectionName: string;
  grade: string;
  academicYear: string;
  studentCount: number;
  attendanceCompleted: boolean;
}

// --- ClassAssignment Model ---
export type ClassAssignmentModel = {
  classAssignmentId: number;
  teacher: TeacherModel;
  teacherRole: TeacherRoles;
  subject: SubjectModel;
  section: SectionModel;
  schoolClass: SchoolClassModel;
  school: SchoolModel;
};
// Types generated from backend Java DTOs and Models
// These types are for use in the Next.js frontend

// --- Section DTOs ---
export interface SectionCreate {
  sectionName: string;
  classId: number;
}

export interface SectionUpdate {
  sectionName: string;
}

export interface SectionAssignmentStudentResponse {
  sectionAssignmentId: number;
  studentId: number;
  studentName: string;
}

export interface SectionResponse {
  sectionId: number;
  sectionName: string;
  students: SectionAssignmentStudentResponse[];
  classAssignments: ClassAssignmentResponse[];
  grade: string;
}

export type YearClassSectionResponse = {
  sectionId: number;
  sectionName: string;
};

export type YearClassResponse = {
  schoolClassId: number;
  grade: string;
  sections: YearClassSectionResponse[];
};

export type AcademicYearResponse = {
  academicYearId: number;
  academicYear: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  classes: YearClassResponse[];
};

export type SchoolClassCreate = {
  grade: string;
  academicYearId: number;
};

export type SchoolClassResponse = {
  schoolClassId: number;
  grade: string;
  sectionNames: string[];
};

export type SchoolClassUpdate = {
  grade: string;
};

export type SectionModel = {
  sectionId: number;
  sectionName: string;
  sectionAssignments: SectionAssignmentModel[];
  classAssignments: ClassAssignmentModel[];
  sectionAttendances?: AttendanceModel[];
  diaryModels?: DiaryModel[];
  schoolClass: SchoolClassModel;
  createdAt: string;
  updatedAt: string;
  school: SchoolModel;
};

export type SchoolClassModel = {
  schoolClassId: number;
  grade: string;
  sections: SectionModel[];
  // academicYear, createdAt, updatedAt, school omitted for brevity
};

export type AcademicYearModel = {
  academicYearId: number;
  academicYear: string;
  startDate: string;
  endDate: string;
  classes: SchoolClassModel[];
  // school omitted for brevity
};

export type AcademicYearCreate = {
  academicYear: string;
  startDate: string;
  endDate: string;
};

export type StudentModel = {
  studentId: number;
  studentName: string;
  dateOfBirth: string;
  sectionAssignments: SectionAssignmentModel[];
  parents: ParentModel[];
  studentAttendances: AttendanceModel[];
  school: SchoolModel;
};

export interface StudentCreate {
  studentName: string;
  dateOfBirth: string;
  parentName1: string;
  parentPhoneNumber1: string;
  parentName2?: string;
  parentPhoneNumber2?: string;
}

export interface StudentUpdate {
  studentName: string;
  dateOfBirth: string;
}

export interface StudentClassResponse {
  grade: string;
  sectionName: string;
}

export interface StudentParentResponse {
  parentId: number;
  parentName: string;
  parentNumber: string;
}

export interface StudentResponse {
  studentId: number;
  studentName: string;
  averageAttendance?: number | null;
  studentClass?: StudentClassResponse | null;
}

export interface StudentDetailResponse {
  studentName: string;
  dateOfBirth: string;
  sectionId: number | null;
  schoolClassName: string | null;
  sectionName: string | null;
  parents: StudentParentResponse[];
}

export type BulkUploadRowStatus = 'SUCCESS' | 'ERROR';

export interface StudentBulkUploadRowResponse {
  rowNumber: number;
  studentName: string;
  dateOfBirth: string;
  parentName1: string;
  parentPhoneNumber1: string;
  parentName2: string;
  parentPhoneNumber2: string;
  rowStatus: BulkUploadRowStatus;
  errorMessage: string;
}

export interface StudentBulkUploadResponse {
  successCount: number;
  failureCount: number;
  rowResults: StudentBulkUploadRowResponse[];
}

export interface PageResponse<T> {
  content: T[];
  pageNum: number;
  pageSize: number;
  numOfElements: number;
  totalElements: number;
}

export type SectionOption = {
  sectionId: number;
  sectionName: string;
};

export type ClassOption = {
  classId: number;
  className: string;
  grade: string;
  sections: SectionOption[];
};

export type TeacherModel = {
  teacherId: number;
  teacherName: string;
  teacherPhoneNumber: string;
  classAssignments?: ClassAssignmentModel[];
  diaryModels?: DiaryModel[];
  user?: UserModel;
  school?: SchoolModel;
  createdAt: string;
  updatedAt: string;
};

// --- Teacher DTOs ---
export interface TeacherAssignmentResponse {
  subjectsTaught: number;
  classesTaught: number;
}

export interface TeacherResponse {
  teacherId: number;
  teacherName: string;
  teacherPhoneNumber: string;
  assignmentResponse: TeacherAssignmentResponse;
}

export interface TeacherCreate {
  teacherName: string;
  teacherPhoneNumber: string;
}

export interface TeacherUpdate {
  teacherName: string;
  teacherPhoneNumber: string;
}

// --- Subject DTOs ---
export interface SubjectResponse {
  subjectId: number;
  subjectName: string;
  isActive: boolean;
}

export interface SubjectCreate {
  subjectName: string;
}

export interface SubjectUpdate {
  subjectName: string;
}

export declare type SubjectModel = {
  subjectId: number;
  subjectName: string;
  isActive: boolean;
  subjectAttendances?: AttendanceModel[];
  // classAssignments, createdAt, updatedAt, school omitted for brevity
};

// --- Parent DTOs ---
export interface ParentCreate {
  parentName: string;
  parentPhoneNumber: string;
}

export interface ParentUpdate {
  parentName: string;
  parentPhoneNumber: string;
}

export interface ParentResponse {
  parentId: number;
  parentName: string;
  parentPhoneNumber: string;
}

export type ParentModel = {
  parentId: number;
  parentName: string;
  parentNumber: string;
  // children, school omitted for brevity
};

export type UserRoles = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export type UserModel = {
  userId: number;
  username: string;
  password?: string;
  role: UserRoles;
  parent?: ParentModel;
  teacher?: TeacherModel;
  // school, createdAt, updatedAt omitted for brevity
};

export type SubscriptionTier = 'PREMIUM' | 'EXTRA_PREMIUM';

export type SchoolModel = {
  schoolId: number;
  schoolName: string;
  address: string;
  phoneNumber: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  messagingEnabled: boolean;
  monthlyMessageLimit: number;
  active: boolean;
  // users, createdAt, updatedAt omitted for brevity
};

// --- SectionAssignment DTOs ---
export interface SectionAssignmentResponse {
  sectionAssignmentId: number;
  sectionId: number;
  sectionName: string;
  studentId: number;
  studentName: string;
}

export interface SectionAssignmentCreate {
  sectionId: number;
  studentId: number;
}

// --- SectionAssignment Model ---
export type SectionAssignmentModel = {
  sectionAssignmentId: number;
  section: SectionModel;
  student: StudentModel;
  school: SchoolModel;
};

// --- Attendance DTOs ---
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LEAVE";

export interface StudentAttendance {
  studentId: number;
  attendanceStatus: AttendanceStatus;
}

export interface MassAttendance {
  studentAttendances: StudentAttendance[];
  attendanceDate: string;
}

export interface AttendanceResponse {
  studentId: number;
  sectionId: number;
  subjectId: number;
  teacherId: number;
  attendanceDate: string;
  attendanceStatus: AttendanceStatus;
}

export interface AttendanceSummary {
  forStudentId: number | null;
  presentCount: number;
  absentCount: number;
  totalCount: number;
}

export interface PerStudentAttendanceSummary {
  subjectId: number | null;
  subjectName: string | null;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  totalCount: number;
}

export interface AttendanceStatusResponse {
  completed: boolean;
}

// --- Attendance Model ---
export type AttendanceModel = {
  attendanceId: number;
  student: StudentModel;
  section: SectionModel;
  attendanceDate: string;
  attendanceStatus: AttendanceStatus;
  performedBy: TeacherModel;
  subject: SubjectModel;
  school: SchoolModel;
};

// --- Diary DTOs ---
export interface DiaryCreate {
  diaryDate: string;
  subjectId: number;
  teacherId: number;
  sectionId: number;
  title: string;
  content: string;
}

export interface DiaryResponse {
  diaryId: number;
  diaryDate: string;
  subjectId: number;
  subjectName: string;
  title: string;
  content: string;
  teacherId: number;
  teacherName: string;
  sectionId: number;
  sectionName: string;
  schoolClassId: number;
  grade: string;
}

export interface DiaryUpdate {
  title: string;
  content: string;
}

export interface DiaryUpdateAdmin {
  title: string;
  content: string;
  diaryDate?: string;
  subjectId?: number | null;
  teacherId?: number | null;
}

// --- Diary Model ---
export type DiaryModel = {
  diaryId: number;
  diaryDate: string;
  subject: SubjectModel;
  title: string;
  content: string;
  createdBy: TeacherModel;
  section: SectionModel;
  school: SchoolModel;
};

// --- User DTOs ---
export interface UserCreateDTO {
  username: string;
  password?: string;
}

export interface UserLoginDTO {
  username: string;
  password: string;
}

export interface UserResponseDTO {
  userId: number;
  username: string;
  schoolId: number;
}

// --- Auth DTOs ---
export interface CurrentUserInfoResponse {
  username: string;
  userRole: string;
  schoolId: number;
}

// --- StudentFee Enums ---
export type FeeTypes = 'ADMISSION_FEE' | 'MONTHLY_FEE' | 'ANNUAL_FEE' | 'EXTRACURRICULAR_FEE' | 'EXAMINATION_FEE';
export type FeeStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';
export type PaymentType = 'CASH' | 'CHEQUE' | 'ESEWA' | 'KHALTI' | 'BANK_TRANSFER';

// --- StudentFee DTOs ---
export interface StudentFeeCreate {
  originalAmount: number;
  discountPercentage: number;
  feeType: FeeTypes;
  dueDate: string;
}

export interface FeePaymentCreate {
  amountPaid: number;
  paidBy: string;
  phoneNumber: string;
  paymentType: PaymentType;
  paymentDate: string;
}

export interface FeePaymentResponse {
  feePaymentId: number;
  amountPaid: number;
  paidBy: string;
  phoneNumber: string;
  paymentType: PaymentType;
  paymentDate: string;
}

export interface StudentFeeResponse {
  studentFeeId: number;
  feeType: FeeTypes;
  feeStatus: FeeStatus;
  originalAmount: number;
  discountPercentage: number;
  dueDate: string;
  netFee: number;
  feePayments: FeePaymentResponse[];
  academicYear: string;
}



