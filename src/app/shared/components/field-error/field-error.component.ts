import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-field-error',
  standalone: true,
  imports: [],
  templateUrl: './field-error.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldErrorComponent {
  control = input<AbstractControl | null>(null);

  private readonly _status = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      const ctrl = this.control();
      if (!ctrl) return;

      this._status.set(ctrl.status);
      const sub = ctrl.statusChanges.subscribe(() => this._status.set(ctrl.status));
      onCleanup(() => sub.unsubscribe());
    });
  }

  errorMessage = computed<string | null>(() => {
    this._status();
    const ctrl = this.control();
    if (!ctrl || ctrl.valid || !ctrl.dirty) return null;

    const errors = ctrl.errors;
    if (!errors) return null;

    if (errors['required']) return 'Ce champ est requis.';
    if (errors['email']) return 'Adresse email invalide.';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères.`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} caractères.`;
    if (errors['pattern']) return 'Format invalide.';

    return 'Valeur invalide.';
  });
}
