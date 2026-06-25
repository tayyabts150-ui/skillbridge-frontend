import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe, CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@core';
import { HotToastService } from '@ngxpert/hot-toast';
import {
  OnboardingApiService,
  PreferenceRecord,
  PersonalityResult,
} from '../../onboarding/onboarding-api.service';
import { Gender } from '@shared/enums/gender.enums';
import { EducationLevelOption } from '@core/authentication/interface';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SkillsEdit } from './skills-edit';

interface TraitDisplay {
  label: string;
  icon: string;
  color: string;
  key: keyof PersonalityResult;
  desc: string;
}

const TRAIT_CONFIG: TraitDisplay[] = [
  {
    label: 'Openness',
    icon: '🌍',
    color: '#4bbfc5',
    desc: 'Curiosity & creativity',
    key: 'opennessPercent',
  },
  {
    label: 'Conscientiousness',
    icon: '📋',
    color: '#4bbfc5',
    desc: 'Discipline & organization',
    key: 'conscientiousnessPercent',
  },
  {
    label: 'Extraversion',
    icon: '🎉',
    color: '#4bbfc5',
    desc: 'Sociability & energy',
    key: 'extraversionPercent',
  },
  {
    label: 'Agreeableness',
    icon: '🤝',
    color: '#4bbfc5',
    desc: 'Compassion & cooperation',
    key: 'agreeablenessPercent',
  },
  {
    label: 'Neuroticism',
    icon: '🌊',
    color: '#4bbfc5',
    desc: 'Emotional sensitivity',
    key: 'neuroticismPercent',
  },
];

@Component({
  selector: 'app-profile-overview',
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    DatePipe,
    MatDialogModule,
    RouterLink,
  ],
})
export class ProfileOverview implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(OnboardingApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(HotToastService);
  private readonly dialog = inject(MatDialog);

  user = toSignal(this.auth.user());
  isLoading = signal(true);
  personalInfo = signal<any>(null);
  preferences = signal<PreferenceRecord | null>(null);
  personalityResult = signal<PersonalityResult | null>(null);

  traitConfig = TRAIT_CONFIG;
  educationLevels = signal<EducationLevelOption[]>([]);

  get genderLabel(): string {
    const g = this.personalInfo()?.gender;
    if (!g) return '';
    return Gender[g] || 'Other';
  }

  get educationLevelLabel(): string {
    const e = this.personalInfo()?.educationLevel;
    if (!e) return '';
    const level = this.educationLevels().find(l => l.educationLevelId === e);
    return level ? level.educationLevelName : 'Other';
  }

  get hasSkills(): boolean {
    const p = this.preferences();
    return !!(p?.skills?.length || p?.careerInterests?.length || p?.courseSkills?.length);
  }

  // Icon mapping for interests
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

  get displayInterests() {
    return (this.preferences()?.careerInterests || []).map(i => ({
      name: i.name,
      icon: i.icon || this.interestIcons[i.name],
    }));
  }

  get hasPersonality(): boolean {
    return !!this.personalityResult();
  }

  ngOnInit() {
    this.refreshData();
  }

  private refreshData() {
    this.isLoading.set(true);

    this.auth.getEducationLevels().subscribe(res => {
      if (res.status === 'success') {
        this.educationLevels.set((res.data?.options as EducationLevelOption[]) || []);
      }
    });

    this.api.getPersonalInfo().subscribe({
      next: res => {
        if (res.status === 'success') {
          const u = this.user();
          this.personalInfo.set({
            ...res.data,
            fullName: u?.fullName || '',
            email: u?.email || '',
          });
        }
      },
    });

    this.api.getPreferences().subscribe({
      next: res => {
        if (res.status === 'success') {
          this.preferences.set(res.data);
        }
      },
    });

    this.api.getPersonalityResult().subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res.status === 'success') {
          this.personalityResult.set(res.data);
        }
      },
      error: () => this.isLoading.set(false),
    });
  }

  goToOnboarding() {
    this.router.navigateByUrl('/onboarding');
  }

  editSkills() {
    const dialogRef = this.dialog.open(SkillsEdit, {
      width: '600px',
      maxHeight: '90vh',
    });

    dialogRef.afterClosed().subscribe(saved => {
      if (saved) {
        this.refreshData();
      }
    });
  }
}
