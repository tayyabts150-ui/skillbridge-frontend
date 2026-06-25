import { Component, EventEmitter, OnInit, Output, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, map, switchMap, throwError } from 'rxjs';
import {
  AcademicPayload,
  AcademicRecord,
  GradeLevel,
  InstitutionItem,
  OnboardingApiService,
  ProgramItem,
} from '../../onboarding-api.service';
import { OnboardingService } from '../../onboarding.service';
import { AuthService } from '@core/authentication/auth.service';
import { CommonModule } from '@angular/common';
import { EducationLevel } from '@shared/enums/education-level.enums';
import { UserRole } from '@shared/enums/userRole.enums';
import { InstitutionType } from '@shared/enums/institution-type.enums';
import { AppErrorDirective } from '@shared/directives/app-error.directive';

import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-step-academic',
  templateUrl: './step-academic.html',
  styleUrl: './step-academic.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AppErrorDirective,
  ],
})
export class StepAcademic implements OnInit {
  @Output() saved = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(OnboardingService);
  private readonly api = inject(OnboardingApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(HotToastService);

  // Education level from Step 1
  educationLevel = signal<EducationLevel>(EducationLevel.University);
  isHighSchool = signal(false);

  // Saved records from backend
  primaryAcademic = signal<AcademicRecord | null>(null);
  academicHistory = signal<AcademicRecord[]>([]);

  // State
  showForm = signal(false);
  editingId = signal<string | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);

  // Dropdowns
  institutions = signal<InstitutionItem[]>([]);
  programs = signal<ProgramItem[]>([]);
  gradeLevels = signal<GradeLevel[]>([]);
  batchYears = signal<number[]>([]);

  readonly universityYears = [
    { label: 'Year 1', value: 1 },
    { label: 'Year 2', value: 2 },
    { label: 'Year 3', value: 3 },
    { label: 'Year 4', value: 4 },
  ];

  readonly highSchoolYears = [
    { label: '1st Year', value: 1 },
    { label: '2nd Year', value: 2 },
  ];

  /** The main degree form */
  degreeForm = this.fb.nonNullable.group({
    institutionId: ['', Validators.required],
    institutionProgramId: ['', Validators.required],
    batchYear: [0, Validators.required],
    gradeLevel: [null as any as number], // High School only
    major: [''], // University only
  });

  ngOnInit() {
    // Get education level from state saved in Step 1
    const user = this.auth.getUserSnapshot();
    this.isHighSchool.set(user.role === UserRole.HIGH_SCHOOL_STUDENT);

    this.setupConditionalValidators();

    // Load existing academic records
    this.isLoading.set(true);
    this.api.getMyAcademics().subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res.status === 'success' && res.data) {
          this.primaryAcademic.set(res.data.primaryAcademic);
          this.academicHistory.set(res.data.academicHistory ?? []);
        } else if (res.status !== 'success') {
          this.toast.error(res.message || 'Failed to load academic records');
        }
        if (!this.primaryAcademic()) {
          this.showForm.set(true);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.showForm.set(true);
      },
    });

    // Load institutions filtered by institution type based on user role
    const instType =
      user.role === UserRole.HIGH_SCHOOL_STUDENT
        ? InstitutionType.HighSchool
        : InstitutionType.University;

    this.api.getInstitutions(instType).subscribe(res => {
      if (res.status === 'success') {
        this.institutions.set(res.data?.items ?? []);
      }
    });

    this.api.getPrograms(instType).subscribe(res => {
      if (res.status === 'success') {
        this.programs.set(res.data?.items ?? []);
      }
    });

    this.api.getGradeLevels().subscribe(res => {
      if (res.status === 'success') {
        this.gradeLevels.set(res.data ?? []);
      }
    });

    this.generateBatchYears();
  }

  private generateBatchYears() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 26; i--) {
      years.push(i);
    }
    this.batchYears.set(years);
  }

  private setupConditionalValidators() {
    const { gradeLevel, major } = this.degreeForm.controls;
    gradeLevel.clearValidators();
    major.clearValidators();
    if (this.isHighSchool()) {
      gradeLevel.setValidators(Validators.required);
    } else {
      major.setValidators(Validators.required);
    }
    gradeLevel.updateValueAndValidity();
    major.updateValueAndValidity();
  }

  openAddForm() {
    this.degreeForm.reset();
    this.editingId.set(null);
    this.showForm.set(true);
  }

  editRecord(record: AcademicRecord) {
    this.showForm.set(true);
    this.editingId.set(record.id);
    this.degreeForm.patchValue({
      institutionId: record.institutionId, // names used as temp until institution lookup API is available
      institutionProgramId: record.institutionProgramId,
      batchYear: record.batchYear,
      gradeLevel: record?.gradeLevel,
      major: record.major ?? '',
    });
    console.log(this.degreeForm.value);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.degreeForm.reset();
  }

  saveRecord() {
    if (this.degreeForm.invalid) {
      this.degreeForm.markAllAsTouched();
      return;
    }

    const v = this.degreeForm.getRawValue();
    this.isSaving.set(true);

    if (this.editingId()) {
      // Update existing record
      const updatePayload = {
        institutionId: v.institutionId,
        institutionProgramId: v.institutionProgramId,
        batchYear: v.batchYear,
        ...(this.isHighSchool() ? { gradeLevel: v.gradeLevel } : { major: v.major }),
      };
      this.api.updateAcademic(this.editingId()!, updatePayload).subscribe({
        next: res => {
          this.isSaving.set(false);
          if (res.status === 'success' && res.data) {
            this.replaceRecord(res.data);
            this.toast.success(res.message || 'Record updated successfully');
            this.cancelForm();
          } else {
            this.toast.error(res.message || 'Failed to update record');
          }
        },
        error: () => {
          this.isSaving.set(false);
        },
      });
    } else {
      // New record
      const academicPayload: AcademicPayload = {
        institutionId: v.institutionId,
        institutionProgramId: v.institutionProgramId,
        batchYear: v.batchYear,
        ...(this.isHighSchool() ? { gradeLevel: v.gradeLevel ?? undefined } : { major: v.major }),
      };

      // New record - Only call onboardingHs/University for the VERY FIRST academic record
      const call$ =
        !this.primaryAcademic() && !this.academicHistory().length
          ? this.isHighSchool()
            ? this.api.submitHsOnboarding({
                institutionId: v.institutionId,
                institutionProgramId: v.institutionProgramId,
                gradeLevel: v.gradeLevel,
                batchYear: v.batchYear,
              })
            : this.api.submitUniversityOnboarding({
                institutionId: v.institutionId,
                institutionProgramId: v.institutionProgramId,
                major: v.major,
                batchYear: v.batchYear,
              })
          : this.api.createAcademic(academicPayload);

      call$.subscribe({
        next: res => {
          this.isSaving.set(false);
          if (res.status === 'success' && res.data) {
            if (!this.primaryAcademic()) {
              this.primaryAcademic.set({ ...res.data, isPrimary: true });
            } else {
              this.academicHistory.update(prev => [...prev, res.data]);
            }
            this.toast.success('Record saved successfully');
            this.cancelForm();
          } else {
            this.toast.error(res.message || 'Failed to save record');
          }
        },
        error: err => {
          this.isSaving.set(false);
          this.toast.error(err.message || 'An error occurred');
        },
      });
    }
  }

  deleteRecord(id: string) {
    this.api.deleteAcademic(id).subscribe({
      next: res => {
        if (res.status === 'success') {
          this.toast.success('Record deleted');
          if (this.primaryAcademic()?.id === id) {
            this.primaryAcademic.set(null);
            if (this.academicHistory().length > 0) {
              const history = [...this.academicHistory()];
              this.primaryAcademic.set(history.shift()!);
              this.academicHistory.set(history);
            }
            if (!this.primaryAcademic()) this.showForm.set(true);
          } else {
            this.academicHistory.update(prev => prev.filter(r => r.id !== id));
          }
        } else {
          this.toast.error(res.message || 'Failed to delete record');
        }
      },
    });
  }

  makePrimary(id: string) {
    this.api.makePrimary(id).subscribe({
      next: res => {
        if (res.status === 'success') {
          this.toast.success('Marked as primary');
          const history = [...this.academicHistory()];
          const newPrimaryIdx = history.findIndex(r => r.id === id);
          const currentPrimary = this.primaryAcademic();

          if (newPrimaryIdx !== -1 && currentPrimary) {
            const newPrimary = history[newPrimaryIdx];
            history.splice(newPrimaryIdx, 1);
            history.unshift({ ...currentPrimary, isPrimary: false });
            this.academicHistory.set(history);
            this.primaryAcademic.set({ ...newPrimary, isPrimary: true });
          }
        } else {
          this.toast.error(res.message || 'Failed to mark as primary');
        }
      },
    });
  }

  private replaceRecord(updated: AcademicRecord) {
    if (this.primaryAcademic()?.id === updated.id) {
      this.primaryAcademic.set(updated);
    } else {
      this.academicHistory.update(prev => {
        const idx = prev.findIndex(r => r.id === updated.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return prev;
      });
    }
  }

  hasRecords = computed(() => !!this.primaryAcademic());

  submit() {
    if (!this.hasRecords()) {
      this.showForm.set(true);
      return;
    }
    this.saved.emit();
  }
}
