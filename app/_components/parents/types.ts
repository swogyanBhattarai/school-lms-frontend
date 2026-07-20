// Display types for parent/guardian report-book components.
// Reuses existing backend DTOs from @/types/lms where possible,
// adding only display-only fields that have no backend equivalent.

import type {
  StudentDetailResponse,
  DiaryResponse,
  SubjectResponse,
  SubjectAttendanceResponse,
  ParentResponse,
} from "@/types/lms";

/** Student = StudentDetailResponse + display-only fields */
export type Student = StudentDetailResponse & {
  initials: string;           // derived from studentName
  rollNumber: number;          // from StudentModel (not in detail response)
  presentCount: number;        // from attendance summary
  totalDays: number;           // from attendance summary
  diaryCount: number;          // from diary query
};

/** Subject = SubjectResponse + display-only fields for the report card */
export type Subject = SubjectResponse & {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
  teacher: string;
  role: string;
};

/** DiaryEntry = DiaryResponse + display-only fields */
export type DiaryEntry = DiaryResponse & {
  teacherInitials: string;     // derived from teacherName
};

/** SubjectAttendance — wraps backend DTO, adds display-only fields */
export type SubjectAttendance = SubjectAttendanceResponse & {
  subjectName: string;
};

/** CalendarMonth — pure UI construct, no backend equivalent */
export interface CalendarMonth {
  label: string;
  startOffset: number;
  days: number;
  statuses: string[];
}

/** Parent = ParentResponse + display-only fields */
export type Parent = ParentResponse & {
  initials: string;            // derived from parentName
  role: string;                // "Father", "Mother", "Guardian"
};
