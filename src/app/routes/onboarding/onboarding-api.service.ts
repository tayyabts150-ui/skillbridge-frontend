import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { InstitutionType } from '@shared/enums/institution-type.enums';
import { ApiResponse } from '@core/authentication/interface';

const API = {
  personalInfo: '/api/profile/personal',
  onboardingHs: '/api/Onboarding/hs-student',
  onboardingUniversity: '/api/Onboarding/university-student',
  academic: '/api/Academic',
  academicMe: '/api/Academic/me',
  institutions: '/api/Institutions',
  programs: '/api/institution-programs',
  preferences: '/api/Preferences/me',
  skills: '/api/Skills',
  careerInterests: '/api/CareerInterests',
  personalityQuestions: '/api/Personality/questions',
  personalitySubmit: '/api/Personality/submit',
  personalityMe: '/api/Personality/me',
  gradeLevels: '/api/Onboarding/grade-levels',
};

// ── Lookup Types ──────────────────────────────────────────
export interface InstitutionItem {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export interface ProgramItem {
  id: string;
  name: string;
  institutionType: string;
  isActive: boolean;
}

export interface GradeLevel {
  name: string;
  value: number;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface LookupItem {
  id: string;
  name: string;
}

export interface CareerInterest {
  id: string;
  name: string;
  icon: string;
}

// ── Personality Assessment ────────────────────────────────
export interface PersonalityQuestion {
  id: string;
  text: string;
  displayOrder: number;
}

export interface PersonalityAnswer {
  questionId: string;
  score: number; // 1 to 5
}

export interface PersonalitySubmitPayload {
  answers: PersonalityAnswer[];
}

export interface PersonalityResult {
  opennessRaw: number;
  opennessPercent: number;
  conscientiousnessRaw: number;
  conscientiousnessPercent: number;
  extraversionRaw: number;
  extraversionPercent: number;
  agreeablenessRaw: number;
  agreeablenessPercent: number;
  neuroticismRaw: number;
  neuroticismPercent: number;
  summary: string;
}

// ── Personal Info ──────────────────────────────────────────
export interface PersonalInfoPayload {
  dateOfBirth: string;
  country: string;
  city: string;
  phoneNumber: string;
  gender: number;
  educationLevel: number;
  shortBio: string;
}

// ── Onboarding submissions ────────────────────────────────
export interface HsOnboardingPayload {
  institutionId: string;
  institutionProgramId: string;
  gradeLevel: number;
  batchYear: number;
}

export interface UniversityOnboardingPayload {
  institutionId: string;
  institutionProgramId: string;
  major: string;
  batchYear: number;
}

// ── Academic CRUD ─────────────────────────────────────────
export interface AcademicPayload {
  institutionId: string;
  institutionProgramId: string;
  gradeLevel?: number; // High School only
  major?: string; // University / Graduate / WorkingProfessional
  batchYear: number;
}

export interface AcademicDocument {
  id: string;
  fileName: string;
  fileUrl: string;
}

export interface AcademicRecord {
  id: string;
  educationLevel: number;
  institutionName: string;
  institutionId: string;
  programName: string;
  institutionProgramId: string;
  gradeLevel?: number;
  major?: string;
  batchYear: number;
  isPrimary: boolean;
  documents: AcademicDocument[];
}

export interface AcademicMeResponse {
  primaryAcademic: AcademicRecord;
  academicHistory: AcademicRecord[];
}

export interface PreferenceRecord {
  skills: LookupItem[];
  careerInterests: CareerInterest[];
  courseSkills: string[];
}

export interface UpdatePreferencePayload {
  skillIds: string[];
  careerInterestIds: string[];
  courseSkills: string[];
}

// ── Legacy interfaces kept for backward compatibility ──
export interface AssessmentPayload {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  answers: number[];
}

@Injectable({ providedIn: 'root' })
export class OnboardingApiService {
  private readonly http = inject(HttpClient);

  // ── Personal ───────────────────────────────────────────
  savePersonalInfo(data: PersonalInfoPayload) {
    return this.http.post<ApiResponse<PersonalInfoPayload>>(API.personalInfo, data);
  }

  updatePersonalInfo(data: PersonalInfoPayload) {
    return this.http.put<ApiResponse<PersonalInfoPayload>>(API.personalInfo, data);
  }

  getPersonalInfo() {
    return this.http.get<ApiResponse<PersonalInfoPayload>>(API.personalInfo);
  }

  // ── Onboarding (called once on first academic save) ────
  submitHsOnboarding(data: HsOnboardingPayload) {
    return this.http.post<ApiResponse<AcademicRecord>>(API.onboardingHs, data);
  }

  submitUniversityOnboarding(data: UniversityOnboardingPayload) {
    return this.http.post<ApiResponse<AcademicRecord>>(API.onboardingUniversity, data);
  }

  // ── Academic CRUD ──────────────────────────────────────
  getMyAcademics() {
    return this.http.get<ApiResponse<AcademicMeResponse>>(API.academicMe);
  }

  createAcademic(data: AcademicPayload) {
    return this.http.post<ApiResponse<AcademicRecord>>(API.academic, data);
  }

  updateAcademic(id: string, data: Omit<AcademicPayload, 'educationLevel'>) {
    return this.http.put<ApiResponse<AcademicRecord>>(`${API.academic}/${id}`, data);
  }

  deleteAcademic(id: string) {
    return this.http.delete<ApiResponse<string>>(`${API.academic}/${id}`);
  }

  makePrimary(id: string) {
    return this.http.put<ApiResponse<string>>(`${API.academic}/${id}/make-current`, {});
  }

  // ── Institutions & Programs ────────────────────────────
  getInstitutions(type?: InstitutionType, page = 1, pageSize = 100) {
    const params: Record<string, any> = { page, pageSize };
    if (type !== undefined) params['type'] = type;
    return this.http.get<ApiResponse<PagedResponse<InstitutionItem>>>(API.institutions, { params });
  }

  getPrograms(type?: InstitutionType, page = 1, pageSize = 100) {
    const params: Record<string, any> = { page, pageSize };
    if (type !== undefined) params['type'] = type;
    return this.http.get<ApiResponse<PagedResponse<ProgramItem>>>(API.programs, { params });
  }

  // ── Personality Assessment ──────────────────────────────
  getPersonalityQuestions() {
    return this.http.get<ApiResponse<PersonalityQuestion[]>>(API.personalityQuestions);
  }

  submitPersonality(data: PersonalitySubmitPayload) {
    return this.http.post<ApiResponse<PersonalityResult>>(API.personalitySubmit, data);
  }

  getPersonalityResult() {
    return this.http.get<ApiResponse<PersonalityResult>>(API.personalityMe);
  }

  // ── Preferences, Skills & Interests ────────────────────
  getPreferences() {
    return this.http.get<ApiResponse<PreferenceRecord>>(API.preferences);
  }

  updatePreferences(data: UpdatePreferencePayload) {
    return this.http.put<ApiResponse<PreferenceRecord>>(API.preferences, data);
  }

  getSkills() {
    return this.http.get<ApiResponse<LookupItem[]>>(API.skills);
  }

  getCareerInterests() {
    return this.http.get<ApiResponse<CareerInterest[]>>(API.careerInterests);
  }

  getGradeLevels() {
    return this.http.get<ApiResponse<GradeLevel[]>>(API.gradeLevels);
  }
}
