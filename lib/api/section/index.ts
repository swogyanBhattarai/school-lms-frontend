import { SectionCreate, SectionUpdate, SectionResponse, SectionModel } from '@/types/lms';
import api from '../../api';

// Get all sections
export async function getAllSections(): Promise<SectionResponse[]> {
  const res = await api.get<SectionResponse[]>('/api/section');
  return res.data;
}

// Get section by ID
export async function getSectionById(id: number): Promise<SectionResponse> {
  const res = await api.get<SectionResponse>(`/api/section/${id}`);
  return res.data;
}

// Get sections by school class ID
export async function getSectionsBySchoolClassId(schoolClassId: number): Promise<SectionResponse[]> {
  const res = await api.get<SectionResponse[]>(`/api/section/class/${schoolClassId}`);
  return res.data;
}

// Create a new section
export async function createSection(section: SectionCreate): Promise<string> {
  const res = await api.post<string>('/api/section', section);
  return res.data;
}

// Delete a section by ID
export async function deleteSection(id: number): Promise<void> {
  await api.delete(`/api/section/${id}`);
}

// Update a section by ID
export async function updateSection(id: number, section: SectionUpdate): Promise<string> {
  const res = await api.put<string>(`/api/section/${id}`, section);
  return res.data;
}
