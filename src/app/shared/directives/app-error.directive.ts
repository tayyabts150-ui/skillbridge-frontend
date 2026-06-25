import { Directive, ElementRef, OnInit, inject, DestroyRef } from '@angular/core';
import { NgControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';

@Directive({
  selector: '[formControlName], [formControl], [ngModel]',
  standalone: true,
})
export class AppErrorDirective implements OnInit {
  private readonly ngControl = inject(NgControl, { optional: true });
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  private errorEl: HTMLElement | null = null;

  private readonly errorMessages: Record<string, (p: any) => string> = {
    required: () => 'This field is required',
    email: () => 'Please enter a valid email address',
    minlength: ({ requiredLength }: any) => `Minimum ${requiredLength} characters required`,
    maxlength: ({ requiredLength }: any) => `Maximum ${requiredLength} characters allowed`,
    pattern: () => 'Invalid format',
    futureDate: () => 'Date cannot be in the future',
    min: ({ min }: any) => `Minimum value is ${min}`,
    max: ({ max }: any) => `Maximum value is ${max}`,
    phone: () => 'Please enter a valid phone number',
  };

  ngOnInit() {
    if (!this.ngControl?.control) {
      console.warn('AppErrorDirective: No control found');
      return;
    }

    // Subscribe to status and value changes
    merge(this.ngControl.statusChanges ?? [], this.ngControl.valueChanges ?? [])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateErrorDisplay());

    // Initial check after view stabilizes
    requestAnimationFrame(() => this.updateErrorDisplay());
  }

  private updateErrorDisplay() {
    const control = this.ngControl?.control;
    if (!control) return;

    // Show error if invalid AND (touched OR dirty)
    if (control.invalid && (control.touched || control.dirty)) {
      this.showError();
    } else {
      this.hideError();
    }
  }

  private getMatFormFieldEl(): HTMLElement | null {
    let el = this.el.nativeElement.parentElement;
    while (el) {
      if (
        el.classList.contains('mat-mdc-form-field') ||
        el.tagName.toLowerCase() === 'mat-form-field'
      ) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  private showError() {
    // FIX: Access errors from control, not ngControl
    const errors = this.ngControl?.control?.errors;
    if (!errors) return;

    const firstKey = Object.keys(errors)[0];
    const getter = this.errorMessages[firstKey];
    const message = getter ? getter(errors[firstKey]) : `Invalid value (${firstKey})`;

    const formField = this.getMatFormFieldEl();
    if (!formField) {
      console.warn('AppErrorDirective: No mat-form-field found');
      return;
    }

    // Get or create the subscript wrapper
    const subscript = formField.querySelector('.mat-mdc-form-field-subscript-wrapper');
    if (!subscript) return;

    // Reuse or create our error element
    if (!this.errorEl) {
      this.errorEl = document.createElement('mat-error');
      this.errorEl.className = 'mat-mdc-form-field-error mat-error';
      this.errorEl.setAttribute('aria-live', 'polite');

      // Insert at the beginning of subscript wrapper
      subscript.insertBefore(this.errorEl, subscript.firstChild);
    }

    this.errorEl.textContent = message;
    this.errorEl.style.display = 'block';

    // Add error styling to form field
    formField.classList.add('mat-form-field-invalid');
  }

  private hideError() {
    if (this.errorEl) {
      this.errorEl.style.display = 'none';
    }

    const formField = this.getMatFormFieldEl();
    formField?.classList.remove('mat-form-field-invalid');
  }
}
