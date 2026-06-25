import { Injectable, inject, signal, computed } from '@angular/core';
import { tap } from 'rxjs';
import {
  OnboardingApiService,
  PersonalInfoPayload,
  AssessmentPayload,
  PersonalityResult,
} from './onboarding-api.service';
import { AuthService } from '@core/authentication/auth.service';

export interface OnboardingState {
  currentStep: number;
  personalInfo: PersonalInfoPayload | null;
  assessment: AssessmentPayload | null;
  personalityResult: PersonalityResult | null;
}

const INITIAL_STATE: OnboardingState = {
  currentStep: 0,
  personalInfo: null,
  assessment: null,
  personalityResult: null,
};

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly api = inject(OnboardingApiService);
  private readonly auth = inject(AuthService);
  private readonly _state = signal<OnboardingState>(INITIAL_STATE);

  readonly state = computed(() => this._state());
  readonly currentStep = computed(() => this._state().currentStep);
  get snapshot() {
    return this._state();
  }

  // No changes needed for these computed getters if I kept them, but I'll update logic

  nextStep() {
    this._state.update(s => ({ ...s, currentStep: s.currentStep + 1 }));
  }

  prevStep() {
    this._state.update(s => ({
      ...s,
      currentStep: Math.max(0, s.currentStep - 1),
    }));
  }

  savePersonalInfo(data: PersonalInfoPayload) {
    return this.api.savePersonalInfo(data).pipe(
      tap(() => {
        this._state.update(s => ({ ...s, personalInfo: data }));
        const currentUser = this.auth.getUserSnapshot();
        const updatedUser = { ...currentUser, ...data };
        this.auth.setUser(updatedUser);
      })
    );
  }

  updatePersonalInfo(data: PersonalInfoPayload) {
    return this.api.updatePersonalInfo(data).pipe(
      tap(() => {
        this._state.update(s => ({ ...s, personalInfo: data }));
        const currentUser = this.auth.getUserSnapshot();
        const updatedUser = { ...currentUser, ...data };
        this.auth.setUser(updatedUser);
      })
    );
  }

  /** Update in-memory state from a preloaded API response (no HTTP call) */
  patchPersonalInfo(data: PersonalInfoPayload) {
    this._state.update(s => ({ ...s, personalInfo: data }));
  }

  saveAssessment(data: AssessmentPayload) {
    this._state.update(s => ({ ...s, assessment: data }));

    const currentUser = this.auth.getUserSnapshot();
    const updatedUser = { ...currentUser, assessment: data };

    this.auth.setUser(updatedUser);
  }

  reset() {
    this._state.set(INITIAL_STATE);
  }

  savePersonalityResult(data: PersonalityResult) {
    this._state.update(s => ({ ...s, personalityResult: data }));
    const currentUser = this.auth.getUserSnapshot();
    const updatedUser = { ...currentUser, personalityResult: data };
    this.auth.setUser(updatedUser);
  }

  patchPersonalityResult(data: PersonalityResult) {
    this._state.update(s => ({ ...s, personalityResult: data }));
  }

  updateState(patch: Partial<OnboardingState>) {
    this._state.update(s => ({ ...s, ...patch }));
  }
}
