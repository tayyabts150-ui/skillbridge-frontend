import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CareerRoadmap {
  role: string;
  learn: LearnCategory[];
  basics: string[];
  certifications: Certification[];
  jobListings: JobListing[];
}

export interface LearnCategory {
  category: string;
  items: string[];
}

export interface Certification {
  name: string;
  provider: string;
  description: string;
  url: string;
}

export interface JobListing {
  platform: string;
  description: string;
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class CareerRoadmapService {
  private readonly http = inject(HttpClient);

  getRoadmap(role: string): Observable<CareerRoadmap> {
    return this.http.get<CareerRoadmap>('/api/CareerRoadmap', {
      params: { role },
    });
  }
}