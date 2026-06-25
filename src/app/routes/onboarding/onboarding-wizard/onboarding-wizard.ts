import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { OnboardingService } from '../onboarding.service';
import { StepPersonal } from '../steps/step-personal/step-personal';
import { StepAcademic } from '../steps/step-academic/step-academic';
import { StepSkills } from '../steps/step-skills/step-skills';
import { StepPsychology } from '../steps/step-psychology/step-psychology';

@Component({
  selector: 'app-onboarding-wizard',
  templateUrl: './onboarding-wizard.html',
  styleUrl: './onboarding-wizard.scss',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    StepPersonal,
    StepAcademic,
    StepSkills,
    StepPsychology,
  ],
})
export class OnboardingWizard implements OnInit {
  protected readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);

  ngOnInit() {
    // Always reset to step 0 when the user enters the onboarding flow,
    // so previous session state is never retained across visits.
    this.onboarding.reset();
  }

  readonly steps = [
    { label: 'Personal Info', icon: 'person', description: 'Tell us about yourself' },
    { label: 'Academics', icon: 'school', description: 'Your educational background' },
    { label: 'Skills & Interests', icon: 'track_changes', description: 'What you know and love' },
    { label: 'Personality', icon: 'spa', description: 'Discover your traits' },
  ];

  // Removed ngOnInit subscription

  onPersonalSaved(data: any) {
    if (this.onboarding.snapshot.personalInfo) {
      this.onboarding.updatePersonalInfo(data).subscribe(() => {
        this.onboarding.nextStep();
      });
    } else {
      this.onboarding.savePersonalInfo(data).subscribe(() => {
        this.onboarding.nextStep();
      });
    }
  }

  onAcademicSaved() {
    this.onboarding.nextStep();
  }

  onSkillsSaved() {
    this.onboarding.nextStep();
  }

  onAssessmentSaved(data: any) {
    this.onboarding.saveAssessment(data);
    this.router.navigateByUrl('/dashboard');
  }

  goBack() {
    this.onboarding.prevStep();
  }
}
