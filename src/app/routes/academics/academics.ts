import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { PageHeader } from '@shared';
import { AcademicEdit } from './academic-edit';
import {
  OnboardingApiService,
  AcademicRecord,
  GradeLevel,
} from '../onboarding/onboarding-api.service';

@Component({
  selector: 'app-academics',
  templateUrl: './academics.html',
  styleUrl: './academics.scss',
  imports: [MatCardModule, MatChipsModule, MatButtonModule, MatIconModule, PageHeader],
})
export class Academics implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly api = inject(OnboardingApiService);

  primaryAcademic = signal<AcademicRecord | null>(null);
  academicHistory = signal<AcademicRecord[]>([]);
  gradeLevels = signal<GradeLevel[]>([]);
  isLoading = signal(true);

  get allRecords(): AcademicRecord[] {
    const primary = this.primaryAcademic();
    return primary ? [primary, ...this.academicHistory()] : [...this.academicHistory()];
  }

  ngOnInit() {
    this.loadAcademics();
    this.loadGradeLevels();
  }

  private loadGradeLevels() {
    this.api.getGradeLevels().subscribe(res => {
      if (res.status === 'success') {
        this.gradeLevels.set(res.data ?? []);
      }
    });
  }

  private loadAcademics() {
    this.isLoading.set(true);
    this.api.getMyAcademics().subscribe({
      next: res => {
        if (res.data) {
          this.primaryAcademic.set(res.data.primaryAcademic ?? null);
          this.academicHistory.set(res.data.academicHistory ?? []);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  add() {
    const dialogRef = this.dialog.open(AcademicEdit, {
      width: '560px',
      maxWidth: '95vw',
      data: { record: null },
    });

    dialogRef.afterClosed().subscribe((record: AcademicRecord | undefined) => {
      if (record) {
        if (!this.primaryAcademic()) {
          this.primaryAcademic.set({ ...record, isPrimary: true });
        } else {
          this.academicHistory.update(h => [...h, record]);
        }
      }
    });
  }

  edit(item: AcademicRecord) {
    const dialogRef = this.dialog.open(AcademicEdit, {
      width: '560px',
      maxWidth: '95vw',
      data: { record: item },
    });

    dialogRef.afterClosed().subscribe((updated: AcademicRecord | undefined) => {
      if (updated) {
        if (this.primaryAcademic()?.id === updated.id) {
          this.primaryAcademic.set(updated);
        } else {
          this.academicHistory.update(h => h.map(r => (r.id === updated.id ? updated : r)));
        }
      }
    });
  }

  delete(item: AcademicRecord) {
    this.api.deleteAcademic(item.id).subscribe(() => {
      if (this.primaryAcademic()?.id === item.id) {
        const history = this.academicHistory();
        this.primaryAcademic.set(history.length > 0 ? history[0] : null);
        this.academicHistory.set(history.slice(1));
      } else {
        this.academicHistory.update(h => h.filter(r => r.id !== item.id));
      }
    });
  }

  makePrimary(item: AcademicRecord) {
    this.api.makePrimary(item.id).subscribe(() => {
      const currentPrimary = this.primaryAcademic();
      if (currentPrimary) {
        this.academicHistory.update(h => [
          { ...currentPrimary, isPrimary: false },
          ...h.filter(r => r.id !== item.id),
        ]);
      }
      this.primaryAcademic.set({ ...item, isPrimary: true });
    });
  }

  getGradeLevelName(value?: number): string {
    if (value === undefined || value === null) return '';
    const level = this.gradeLevels().find(l => l.value === value);
    return level ? level.name : `Grade ${value}`;
  }
}
