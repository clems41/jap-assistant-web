import {ChangeDetectionStrategy, Component, effect, inject, input, model} from '@angular/core';
import {Tournament, TournamentRequest} from '../../../../shared/models/tournament.models';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {SelectModule} from 'primeng/select';
import {DatePickerModule} from 'primeng/datepicker';
import {ButtonModule} from 'primeng/button';
import {TournamentService} from '../../../../shared/services/tournament.service';
import {EnumChoice} from '../../../../shared/models/base.models';
import {InputTextModule} from 'primeng/inputtext';
import {fromBackendToDate, toISODate} from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-infos',
  imports: [
    ReactiveFormsModule,
    SelectModule,
    DatePickerModule,
    ButtonModule,
    InputTextModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './infos.component.html'
})
export class InfosComponent {
  tournament = model.required<Tournament>();
  loading = model.required<boolean>();
  private readonly formBuilder = inject(FormBuilder);
  private readonly tournamentService = inject(TournamentService);
  availableGenders = input.required<EnumChoice[]>();
  availableCategories = input.required<EnumChoice[]>();
  availableLeagues = input.required<EnumChoice[]>();
  updateForm: FormGroup = this.buildUpdateForm();
  minDate: Date = new Date();

  constructor() {
    effect(() => {
      const t = this.tournament();
      this.updateForm.patchValue({
        name: t.name,
        category: t.category,
        start_date: fromBackendToDate(t.start_date),
        location: t.location,
        league: t.league,
        gender: t.gender,
      });
    });
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

}
