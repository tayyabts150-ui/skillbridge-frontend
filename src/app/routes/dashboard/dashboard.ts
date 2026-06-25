import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { SettingsService } from '@core';
import { MtxAlertModule } from '@ng-matero/extensions/alert';
import { NgStyle } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@core';
import { Router } from '@angular/router';
import { Career } from './data';
import { DashboardApiService } from './dashboard-api.service';
import { PersonalityResult } from '../onboarding/onboarding-api.service';
import { finalize, forkJoin } from 'rxjs';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatListModule,
    MatGridListModule,
    MatTableModule,
    MatTabsModule,
    MatIconModule,
    MtxAlertModule,
    NgStyle,
  ],
})
export class Dashboard implements OnInit {
  private readonly settings = inject(SettingsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly toast = inject(HotToastService);

  user = toSignal(this.auth.user());
  isLoading = signal(true);
  careers = signal<Career[]>([]);
  personality = signal<PersonalityResult | null>(null);

  // Removed manual getter "careers" as it's now a signal

  userData = computed(() => {
    const u = this.user();
    return {
      fullName: u?.fullName || 'User',
      greeting: 'Welcome back',
      subtitle: 'Here are your recommended career paths based on your profile.',
    };
  });

  personalityTraits = computed(() => {
    const p = this.personality();
    return [
      { name: 'Openness', percentage: p?.opennessPercent || 0, color: '#4bbfc5' },
      { name: 'Conscientiousness', percentage: p?.conscientiousnessPercent || 0, color: '#4bbfc5' },
      { name: 'Extraversion', percentage: p?.extraversionPercent || 0, color: '#4bbfc5' },
      { name: 'Agreeableness', percentage: p?.agreeablenessPercent || 0, color: '#4bbfc5' },
      { name: 'Neuroticism', percentage: p?.neuroticismPercent || 0, color: '#4bbfc5' },
    ];
  });

  hasAssessment = computed(() => this.personalityTraits().some((t: any) => t.percentage > 0));

  get isDark() {
    return this.settings.getThemeColor() == 'dark';
  }

  ngOnInit() {
    this.isLoading.set(true);

    forkJoin({
      recommendations: this.dashboardApi.getJobRecommendations(4),
      personality: this.dashboardApi.getPersonalityMe(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: res => {
          if (res.recommendations.status === 'success') {
            const jobs = res.recommendations.data.jobs || [];
            this.careers.set(
              jobs.map((j: any) => ({
                name: j.title,
                description: j.description,
                match: j.matchPercentage,
                tags: j.tags || [],
              }))
            );
          }
          if (res.personality.status === 'success') {
            this.personality.set(res.personality.data);
          }
        },
        error: () => this.toast.error('Failed to load dashboard data'),
      });
  }
exploreCareer(careerName: string): void {
  this.router.navigate(['/career-roadmap'], {
    queryParams: { role: careerName },
  });
}
  goToOnboarding() {
    this.router.navigateByUrl('/onboarding');
  }

  
}
