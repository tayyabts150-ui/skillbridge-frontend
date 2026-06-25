import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export class AppValidators {
  /**
   * Validates international phone numbers in E.164 format.
   * Must start with + followed by 7–15 digits.
   * Examples: +923001234567, +12025551234
   */
  static phone(): ValidatorFn {
    return Validators.pattern(/^\+[1-9]\d{6,14}$/);
  }

  /**
   * Validates if a date is not in the future
   */
  static noFutureDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const selectedDate = new Date(control.value);
      const today = new Date();

      if (selectedDate > today) {
        return { futureDate: true };
      }
      return null;
    };
  }
}
