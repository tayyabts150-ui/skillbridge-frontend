import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  CareerInterest,
  LookupItem,
  OnboardingApiService,
  UpdatePreferencePayload,
} from '../../onboarding-api.service';
import { OnboardingService } from '../../onboarding.service';
import { CommonModule } from '@angular/common';

import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-step-skills',
  templateUrl: './step-skills.html',
  styleUrl: './step-skills.scss',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class StepSkills implements OnInit {
  @Output() saved = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  private readonly onboarding = inject(OnboardingService);
  private readonly api = inject(OnboardingApiService);
  private readonly toast = inject(HotToastService);

  allSkills = signal<LookupItem[]>([]);
  allInterests = signal<CareerInterest[]>([]);

  selectedSkillIds = signal<Set<string>>(new Set());
  selectedInterestIds = signal<Set<string>>(new Set());
  courseSkills = signal<string[]>([]);
  courseInput = signal('');

  isLoading = signal(false);
  isSaving = signal(false);

  // Icon mapping for common interests
  private readonly interestIcons: Record<string, string> = {
    'Technology': 'devices',
    'Healthcare': 'local_hospital',
    'Design': 'palette',
    'Education': 'school',
    'Finance': 'account_balance',
    'Arts & Design': 'palette',
    'Business & Finance': 'business_center',
    'Law & Policy': 'gavel',
    'Environment': 'eco',
    'Science & Research': 'science',
    'Marketing': 'trending_up',
    'Social Work': 'people',
  };

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.isLoading.set(true);

    // Load available lookups
    this.api.getSkills().subscribe(res => {
      if (res.status === 'success') {
        this.allSkills.set(res.data ?? []);
      }
    });

    this.api.getCareerInterests().subscribe(res => {
      if (res.status === 'success') {
        const data = res.data ?? [];
        this.allInterests.set(data.map(i => ({ ...i, icon: this.interestIcons[i.name] })));
      }
    });

    // Load current preferences
    this.api.getPreferences().subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res.status === 'success' && res.data) {
          const d = res.data;
          this.selectedSkillIds.set(new Set(d.skills.map(s => s.id)));
          this.selectedInterestIds.set(new Set(d.careerInterests.map(i => i.id)));
          this.courseSkills.set([...(d.courseSkills ?? [])]);
        } else if (res.status !== 'success') {
          this.toast.error(res.message || 'Failed to load preferences');
        }
      },
      error: () => this.isLoading.set(false),
    });
  }

  getInterestIcon(name: string): string {
    return this.interestIcons[name] || '🎯';
  }

  toggleSkill(id: string) {
    this.selectedSkillIds.update(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  toggleInterest(id: string) {
    this.selectedInterestIds.update(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  addCourseSkill(value: string) {
    const v = value.trim();
    if (v && !this.courseSkills().includes(v)) {
      this.courseSkills.update(prev => [...prev, v]);
    }
    this.courseInput.set('');
  }

  removeCourseSkill(skill: string) {
    this.courseSkills.update(prev => prev.filter(s => s !== skill));
  }

  submit() {
    this.save();
  }

  skip() {
    this.selectedSkillIds.set(new Set());
    this.selectedInterestIds.set(new Set());
    this.courseSkills.set([]);
    this.save();
  }

  private save() {
    this.isSaving.set(true);
    const payload: UpdatePreferencePayload = {
      skillIds: Array.from(this.selectedSkillIds()),
      careerInterestIds: Array.from(this.selectedInterestIds()),
      courseSkills: this.courseSkills(),
    };

    this.api.updatePreferences(payload).subscribe({
      next: res => {
        this.isSaving.set(false);
        if (res.status === 'success') {
          this.toast.success('Preferences saved successfully');
          this.saved.emit();
        } else {
          this.toast.error(res.message || 'Failed to save preferences');
        }
      },
      error: () => this.isSaving.set(false),
    });
  }
}
