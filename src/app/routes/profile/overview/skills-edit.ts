import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HotToastService } from '@ngxpert/hot-toast';
import {
  CareerInterest,
  LookupItem,
  OnboardingApiService,
  UpdatePreferencePayload,
} from '../../onboarding/onboarding-api.service';

@Component({
  selector: 'app-skills-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './skills-edit.html',
  styleUrl: './skills-edit.scss',
})
export class SkillsEdit implements OnInit {
  private readonly api = inject(OnboardingApiService);
  private readonly toast = inject(HotToastService);
  private readonly dialogRef = inject(MatDialogRef<SkillsEdit>);

  allSkills = signal<LookupItem[]>([]);
  allInterests = signal<CareerInterest[]>([]);
  selectedSkillIds = signal<Set<string>>(new Set());
  selectedInterestIds = signal<Set<string>>(new Set());
  courseSkills = signal<string[]>([]);
  courseInput = signal('');

  isLoading = signal(false);
  isSaving = signal(false);

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

    this.api.getPreferences().subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res.status === 'success' && res.data) {
          const d = res.data;
          this.selectedSkillIds.set(new Set(d.skills.map(s => s.id)));
          this.selectedInterestIds.set(new Set(d.careerInterests.map(i => i.id)));
          this.courseSkills.set([...(d.courseSkills ?? [])]);
        }
      },
      error: () => this.isLoading.set(false),
    });
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

  onKeydown(event: KeyboardEvent, type: 'skill' | 'interest', id: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (type === 'skill') this.toggleSkill(id);
      else this.toggleInterest(id);
    }
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

  save() {
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
          this.toast.success('Preferences updated successfully');
          this.dialogRef.close(true);
        } else {
          this.toast.error(res.message || 'Failed to update preferences');
        }
      },
      error: () => this.isSaving.set(false),
    });
  }
}
