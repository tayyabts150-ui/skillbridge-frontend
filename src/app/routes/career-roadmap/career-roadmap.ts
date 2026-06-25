import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CareerRoadmap, CareerRoadmapService } from './career-roadmap.service';
import { CareerChatWidget } from './career-chat-widget';
@Component({
  selector: 'app-career-roadmap',
  standalone: true,
imports: [CommonModule, MatCardModule, MatButtonModule, CareerChatWidget],
  templateUrl: './career-roadmap.html',
  styleUrl: './career-roadmap.scss',
})
export class CareerRoadmapComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CareerRoadmapService);

  isLoading = signal(true);
  error = signal<string | null>(null);
  roadmap = signal<CareerRoadmap | null>(null);

  ngOnInit(): void {
    const role = this.route.snapshot.queryParamMap.get('role');

    if (!role) {
      this.error.set('Career role is missing.');
      this.isLoading.set(false);
      return;
    }

    this.service.getRoadmap(role).subscribe({
      next: response => {
        this.roadmap.set(response);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Could not generate roadmap. Please try again.');
        this.isLoading.set(false);
      },
    });
  }
}