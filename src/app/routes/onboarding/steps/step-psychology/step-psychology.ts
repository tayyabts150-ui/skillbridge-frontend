import { Component, EventEmitter, OnInit, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HotToastService } from '@ngxpert/hot-toast';
import {
  OnboardingApiService,
  PersonalityQuestion,
  PersonalityResult,
  PersonalitySubmitPayload,
} from '../../onboarding-api.service';
import { finalize } from 'rxjs';
import { OnboardingService } from '../../onboarding.service';

interface TraitDisplay {
  label: string;
  icon: string;
  color: string;
  desc: string;
  key: keyof PersonalityResult;
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
  selector: 'app-step-psychology',
  templateUrl: './step-psychology.html',
  styleUrl: './step-psychology.scss',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    FormsModule,
  ],
})
export class StepPsychology implements OnInit {
  @Output() saved = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  private readonly onboarding = inject(OnboardingService);
  private readonly api = inject(OnboardingApiService);
  private readonly toast = inject(HotToastService);

  questions = signal<PersonalityQuestion[]>([]);
  traitConfig = TRAIT_CONFIG;

  answers = signal<Record<string, number>>({});
  showResults = signal(false);
  isLoading = signal(false);
  results = signal<PersonalityResult | null>(null);

  answeredCount = computed(() => Object.keys(this.answers()).length);

  allAnswered = computed(() => {
    const questionsLength = this.questions().length;
    return questionsLength > 0 && this.answeredCount() === questionsLength;
  });

  progress = computed(() => {
    const questionsLength = this.questions().length;
    if (questionsLength === 0) return 0;
    return Math.round((this.answeredCount() / questionsLength) * 100);
  });

  ngOnInit() {
    this.isLoading.set(true);
    this.api
      .getPersonalityQuestions()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: res => {
          if (res.status === 'success' && res.data) {
            this.questions.set(res.data.sort((a, b) => a.displayOrder - b.displayOrder));
          } else {
            this.toast.error(res.message || 'Failed to load questions');
          }
        },
        error: () => this.toast.error('Failed to connect to the server'),
      });

    // Check if we already have results in state
    const savedResults = this.onboarding.snapshot.personalityResult;
    if (savedResults) {
      this.results.set(savedResults);
      this.showResults.set(true);
    }
  }

  setAnswer(questionId: string, value: number) {
    this.answers.update(prev => ({ ...prev, [questionId]: value }));
  }

  submitAssessment() {
    if (!this.allAnswered()) return;

    this.isLoading.set(true);
    const payload: PersonalitySubmitPayload = {
      answers: Object.entries(this.answers()).map(([questionId, score]) => ({
        questionId,
        score,
      })),
    };

    this.api
      .submitPersonality(payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: res => {
          if (res.status === 'success' && res.data) {
            this.results.set(res.data);
            this.showResults.set(true);
            this.onboarding.savePersonalityResult(res.data);
            this.toast.success('Assessment completed successfully!');
          } else {
            this.toast.error(res.message || 'Failed to save assessment');
          }
        },
        error: () => this.toast.error('Failed to submit results'),
      });
  }

  finish() {
    this.saved.emit();
  }

  skip() {
    this.saved.emit();
  }
}
