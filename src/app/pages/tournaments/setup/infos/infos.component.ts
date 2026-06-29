import {ChangeDetectionStrategy, Component, computed, effect, inject, input, model, signal} from '@angular/core';
import {Tournament, TournamentRequest, TournamentStatus} from '../../../../shared/models/tournament.models';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {SelectModule} from 'primeng/select';
import {DatePickerModule} from 'primeng/datepicker';
import {ButtonModule} from 'primeng/button';
import {TournamentService} from '../../../../shared/services/tournament.service';
import {EnumChoice} from '../../../../shared/models/base.models';
import {InputTextModule} from 'primeng/inputtext';
import {fromBackendToDate, toISODate} from '../../../../shared/utils/date.utils';
import {Router} from '@angular/router';
import {ConfirmationService} from 'primeng/api';
import {LoadingSpinnerComponent} from '../../../../shared/components/loading-spinner/loading-spinner.component';
import {QrCodeShareComponent} from '../../../../shared/components/qr-code-share/qr-code-share.component';

@Component({
  selector: 'app-infos',
  imports: [
    ReactiveFormsModule,
    SelectModule,
    DatePickerModule,
    ButtonModule,
    InputTextModule,
    LoadingSpinnerComponent,
    QrCodeShareComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './infos.component.html'
})
export class InfosComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly tournamentService = inject(TournamentService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);
  tournament = model.required<Tournament>();
  availableLocations = input.required<string[]>();
  availableGenders = input.required<EnumChoice[]>();
  availableCategories = input.required<EnumChoice[]>();
  availableLeagues = input.required<EnumChoice[]>();
  loading = signal<boolean>(false);
  canDelete = computed(() => this.tournament().status === TournamentStatus.DRAFT);
  updateForm: FormGroup = this.buildUpdateForm();
  minDate: Date = new Date();

  constructor() {
    effect(() => {
      const t = this.tournament();
      this.resetForm(t);
    });
  }

  private resetForm(tournament: Tournament): void {
    this.updateForm.patchValue({
      name: tournament.name,
      category: tournament.category,
      start_date: fromBackendToDate(tournament.start_date),
      location: tournament.location,
      league: tournament.league,
      gender: tournament.gender,
    });
    this.updateForm.markAsUntouched();
  }

  private buildUpdateForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required]],
      category: [null, [Validators.required]],
      start_date: [null, [Validators.required]],
      location: [null, [Validators.required]],
      league: [null, [Validators.required]],
      gender: [null, [Validators.required]],
    })
  }

  updateTournament(): void {
    if (this.updateForm.invalid) return
    this.loading.set(true);
    const {name, category, start_date, location, league, gender} = this.updateForm.value;
    const input: TournamentRequest = {
      name: name,
      category: category,
      start_date: toISODate(start_date),
      location: location,
      league: league,
      gender: gender
    };
    this.tournamentService.updateTournament(this.tournament().id, input).subscribe({
      next: (response) => {
        this.tournament.set(response);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    })
  }

  cancel(): void {
    const t = this.tournament();
    this.resetForm(t);
  }

  deleteTournament(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Êtes-vous sûr de vouloir supprimer le tournoi '${this.tournament().name}' ?`,
      header: 'Confirmation',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Annuler',
        severity: 'danger',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Supprimer',
        severity: 'danger',
      },
      accept: () => {
        this.loading.set(true);
        this.tournamentService.deleteTournament(this.tournament().id).subscribe({
          next: () => {
            this.loading.set(false);
            this.router.navigate(['/home']).then();
          },
          error: () => {
            this.loading.set(false);
          }
        })
      },
    });

  }

}
