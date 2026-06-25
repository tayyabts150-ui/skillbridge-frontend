import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import {
  AcademicRecord,
  GradeLevel,
  InstitutionItem,
  OnboardingApiService,
  ProgramItem,
} from '../onboarding/onboarding-api.service';
import { AuthService } from '@core';
import { EducationLevel } from '@shared/enums/education-level.enums';
import { UserRole } from '@shared/enums/userRole.enums';
import { InstitutionType } from '@shared/enums/institution-type.enums';

export interface AcademicEditDialogData {
  record: AcademicRecord | null;
}

import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-academic-edit',
  template: `
    <h2 mat-dialog-title class="m-b-16">{{ data.record ? 'Edit' : 'Add' }} Academic Record</h2>
    <mat-dialog-content>
      <form [formGroup]="degreeForm" class="flex flex-col gap-4 mt-4">
        <div class="row">
          <!-- Institution -->
          <div class="col-12 m-b-16">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>
                {{ isHighSchool() ? 'School / Institution' : 'University / Institution' }}
              </mat-label>
              <mat-select formControlName="institutionId">
                @for (inst of institutions(); track inst.id) {
                  <mat-option [value]="inst.id">{{ inst.name }}</mat-option>
                }
              </mat-select>
              @if (
                degreeForm.get('institutionId')?.invalid && degreeForm.get('institutionId')?.touched
              ) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>
          </div>

          <!-- Program -->
          <div class="col-md-6 m-b-16">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>
                {{ isHighSchool() ? 'Degree / Certificate' : 'Degree / Program' }}
              </mat-label>
              <mat-select formControlName="institutionProgramId">
                @for (p of programs(); track p.id) {
                  <mat-option [value]="p.id">{{ p.name }}</mat-option>
                }
              </mat-select>
              @if (
                degreeForm.get('institutionProgramId')?.invalid &&
                degreeForm.get('institutionProgramId')?.touched
              ) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="col-md-6 m-b-16 flex gap-2">
            <!-- Grade (HS Only) -->
            @if (isHighSchool()) {
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Grade</mat-label>
                <mat-select formControlName="gradeLevel">
                  @for (y of gradeLevels(); track y.value) {
                    <mat-option [value]="y.value">{{ y.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }

            <!-- University Year or HS Batch Year -->
            @if (!isHighSchool()) {
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Batch Year</mat-label>
                <mat-select formControlName="batchYear">
                  @for (y of universityYears; track y.value) {
                    <mat-option [value]="y.value">{{ y.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            } @else {
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Batch Year</mat-label>
                <mat-select formControlName="batchYear">
                  @for (year of batchYears(); track year) {
                    <mat-option [value]="year">{{ year }}</mat-option>
                  }
                </mat-select>
                @if (degreeForm.get('batchYear')?.invalid && degreeForm.get('batchYear')?.touched) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>
            }
          </div>

          <!-- Major (non-HS) -->
          @if (!isHighSchool()) {
            <div class="col-12 m-b-16">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Major / Field of Study</mat-label>
                <input matInput formControlName="major" placeholder="e.g. Computer Science" />
                @if (degreeForm.get('major')?.invalid && degreeForm.get('major')?.touched) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>
            </div>
          }
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="p-24">
      <button mat-button (click)="onCancel()" class="text-slate-500">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        (click)="onSave()"
        [disabled]="degreeForm.invalid || isSaving()"
        class="save-btn hvr-lift"
      >
        @if (isSaving()) {
          <mat-spinner diameter="18" style="display:inline-block;margin-right:8px" />
        }
        {{ data.record ? 'Update' : 'Save' }} Record
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        width: 100%;
        min-width: 500px;
        max-width: 600px;

        @media (max-width: 767px) {
          min-width: auto;
          padding: 8px !important;
        }
      }
      .w-full {
        width: 100%;
      }
      .save-btn {
        height: 44px;
        padding: 0 24px;
        border-radius: 12px;
        font-weight: 700;
      }
    `,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class AcademicEdit implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AcademicEdit>);
  private readonly api = inject(OnboardingApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(HotToastService);
  readonly data = inject<AcademicEditDialogData>(MAT_DIALOG_DATA);

  institutions = signal<InstitutionItem[]>([]);
  programs = signal<ProgramItem[]>([]);
  gradeLevels = signal<GradeLevel[]>([]);
  batchYears = signal<number[]>([]);
  isSaving = signal(false);

  isHighSchool = signal(false);

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

  degreeForm = this.fb.nonNullable.group({
    institutionId: ['', Validators.required],
    institutionProgramId: ['', Validators.required],
    batchYear: [0, Validators.required],
    gradeLevel: [null as any as number],
    major: [''],
  });

  ngOnInit() {
    // Determine initial education level from user state
    const user = this.auth.getUserSnapshot();
    this.isHighSchool.set(user.role === UserRole.HIGH_SCHOOL_STUDENT);

    // Prefill if editing
    const rec = this.data?.record;
    if (rec) {
      this.degreeForm.patchValue({
        institutionId: rec.institutionId,
        institutionProgramId: rec.institutionProgramId,
        batchYear: rec.batchYear,
        gradeLevel: rec.gradeLevel,
        major: rec.major ?? '',
      });
    }

    this.setupConditionalValidators();

    // Load lookup data
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
    for (let i = currentYear; i >= 2000; i--) {
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

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.degreeForm.invalid) {
      this.degreeForm.markAllAsTouched();
      return;
    }

    const v = this.degreeForm.getRawValue();
    this.isSaving.set(true);

    const rec = this.data?.record;

    if (rec) {
      // Update
      const payload = {
        institutionId: v.institutionId,
        institutionProgramId: v.institutionProgramId,
        batchYear: v.batchYear,
        ...(this.isHighSchool() ? { gradeLevel: v.gradeLevel ?? undefined } : { major: v.major }),
      };
      this.api.updateAcademic(rec.id, payload).subscribe({
        next: res => {
          this.isSaving.set(false);
          if (res.status === 'success' && res.data) {
            this.toast.success(res.message || 'Record updated');
            this.dialogRef.close(res.data);
          } else {
            this.toast.error(res.message || 'Failed to update record');
          }
        },
        error: () => {
          this.isSaving.set(false);
        },
      });
    } else {
      // Create
      const payload = {
        institutionId: v.institutionId,
        institutionProgramId: v.institutionProgramId,
        batchYear: v.batchYear,
        ...(this.isHighSchool() ? { gradeLevel: v.gradeLevel ?? undefined } : { major: v.major }),
      };
      this.api.createAcademic(payload).subscribe({
        next: res => {
          this.isSaving.set(false);
          if (res.status === 'success' && res.data) {
            this.toast.success(res.message || 'Record saved');
            this.dialogRef.close(res.data);
          } else {
            this.toast.error(res.message || 'Failed to save record');
          }
        },
        error: () => {
          this.isSaving.set(false);
        },
      });
    }
  }
}
