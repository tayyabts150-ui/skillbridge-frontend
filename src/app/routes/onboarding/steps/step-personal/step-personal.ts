import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PersonalInfoPayload, OnboardingApiService } from '../../onboarding-api.service';
import { OnboardingService } from '../../onboarding.service';
import { AuthService } from '@core/authentication';
import { AppValidators } from '@shared/validators/app-validators';
import { AppErrorDirective } from '@shared/directives/app-error.directive';
import { Gender } from '@shared/enums/gender.enums';
import { EducationLevel } from '@shared/enums/education-level.enums';
import { EducationLevelOption } from '@core/authentication/interface';

import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-step-personal',
  templateUrl: './step-personal.html',
  styleUrl: './step-personal.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    AppErrorDirective,
  ],
})
export class StepPersonal implements OnInit {
  @Output() saved = new EventEmitter<PersonalInfoPayload>();

  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(OnboardingService);
  private readonly auth = inject(AuthService);
  private readonly api = inject(OnboardingApiService);
  private readonly toast = inject(HotToastService);

  isLoading = signal(false);
  isSaving = signal(false);

  form = this.fb.nonNullable.group({
    dateOfBirth: ['', [Validators.required, AppValidators.noFutureDate()]],
    gender: [0, Validators.required],
    educationLevel: [0, Validators.required],
    phoneNumber: ['', [Validators.required, AppValidators.phone()]],
    country: ['', Validators.required],
    city: ['', Validators.required],
    shortBio: [''],
  });

  readonly maxDate = new Date();

  readonly genders = [
    { label: 'Male', value: Gender.Male },
    { label: 'Female', value: Gender.Female },
    { label: 'Prefer not to say', value: Gender.PreferNotToSay },
  ];

  educationLevels = signal<EducationLevelOption[]>([]);

  readonly countries = [
    'Pakistan',
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'India',
    'Germany',
    'UAE',
    'Saudi Arabia',
    'Other',
  ];

  ngOnInit() {
    this.isLoading.set(true);

    // Load education levels from API
    this.auth.getEducationLevels().subscribe(res => {
      if (res.status === 'success') {
        this.educationLevels.set((res.data?.options as EducationLevelOption[]) || []);
      }
    });

    // First try to prefill from the API
    this.api.getPersonalInfo().subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res.status === 'success' && res.data) {
          const d = res.data;
          this.form.patchValue(d);
          // Also update in-memory state so Step 2 has the educationLevel
          this.onboarding.patchPersonalInfo(d);
        } else if (res.status !== 'success' && res.status !== undefined) {
          // If status is not success, message should contain why
          this.toast.error(res.message || 'Failed to load personal info');
          this.loadFromLocalStateToForm();
        }
      },
      // Fall back to local onboarding state if API fails
      error: () => {
        this.isLoading.set(false);
        this.loadFromLocalStateToForm();
      },
    });
  }

  private loadFromLocalStateToForm() {
    const saved = this.onboarding.snapshot.personalInfo;
    if (saved) this.form.patchValue(saved);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    this.saved.emit(this.form.getRawValue());
  }
}
