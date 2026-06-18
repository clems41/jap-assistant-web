import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { format } from "date-fns";
import { EMPTY, merge, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-field-error',
  standalone: true,
  imports: [],
  templateUrl: './field-error.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldErrorComponent {
  control = input<AbstractControl | null>(null);

  private readonly _trigger = toSignal(
    toObservable(this.control).pipe(
      switchMap(ctrl => ctrl ? merge(of(null), ctrl.statusChanges, ctrl.valueChanges) : EMPTY)
    ),
    { initialValue: null }
  );

  errorMessage = computed<string | null>(() => {
    this._trigger();
    const ctrl = this.control();
    if (!ctrl || ctrl.valid || (!ctrl.dirty && !ctrl.touched)) return null;

    const errors = ctrl.errors;
    if (!errors) return null;

    if (errors['required']) return 'Ce champ est requis.';
    if (errors['email']) return 'Adresse email invalide.';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères.`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} caractères.`;
    if (errors['pattern']) return 'Format invalide.';
    if (errors['isNotLicenseNumber']) return 'Numéro de licence incorrecte : 7 chiffres et 1 lettres majuscules.';
    if (errors['nbPairRoundMismatchPairCount']) return 'Le nombre total de paire entrante ne correspond au nombre de paires inscrites.';
    if (errors['minDate']) return `La date doit être après le : ${errors['minDate']?.minDate ? format(errors['minDate'].minDate, 'dd/MM/yyyy') : 'XXX'}.`;
    if (errors['maxDate']) return `La date doit être avant le : ${errors['maxDate']?.maxDate ? format(errors['maxDate'].maxDate, 'dd/MM/yyyy') : 'XXX'}.`;

    return 'Valeur invalide.';
  });
}
