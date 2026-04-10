import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import {isAfter, isBefore} from 'date-fns';

export function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('password_confirm')?.value;
  return password === confirm ? null : {passwordMismatch: true};
}

export function isLicenseNumber(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null
  }
  const controlValue: string = control.value;
  const regexpPattern = String.raw`^\d{7}[A-Z]{1}$`;
  const regexp = new RegExp(regexpPattern);
  if (!regexp.test(controlValue)) {
    return {isNotLicenseNumber: true};
  }
  return null;
}

export function validScoreBasedOnGameFormat(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('password_confirm')?.value;
  return password === confirm ? null : {passwordMismatch: true};
}

export function minDate(minDate: Date, checkHours: boolean = false): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null
    }
    const controlValue: Date = new Date(control.value);
    if (!checkHours) {
      controlValue.setHours(0, 0, 0, 0);
      minDate.setHours(0, 0, 0, 0);
    }
    if (isBefore(controlValue, minDate)) {
      return {minDate: {minDate: minDate}};
    }
    return null;
  };
}

export function maxDate(maxDate: Date, checkHours: boolean = false): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null
    }
    const controlValue: Date = new Date(control.value);
    if (!checkHours) {
      controlValue.setHours(0, 0, 0, 0);
      maxDate.setHours(0, 0, 0, 0);
    }
    if (isAfter(controlValue, maxDate)) {
      return {maxDate: {maxDate: maxDate}};
    }
    return null;
  };
}
