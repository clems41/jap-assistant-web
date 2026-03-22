import {ChangeDetectionStrategy, Component, effect, inject, model, signal} from '@angular/core';
import {Tournament, TournamentRequest} from '../../../../shared/models/tournament.models';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {SelectModule} from 'primeng/select';
import {toSignal} from '@angular/core/rxjs-interop';
import {TournamentService} from '../../../../shared/services/tournament.service';
import {ButtonModule} from 'primeng/button';
import {InputNumberModule} from 'primeng/inputnumber';
import {LoadingSpinnerComponent} from '../../../../shared/components/loading-spinner/loading-spinner.component';
import {TimeSlotsComponent} from './time-slots/time-slots.component';

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    SelectModule,
    ButtonModule,
    InputNumberModule,
    LoadingSpinnerComponent,
    TimeSlotsComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  tournament = model.required<Tournament>();
  private readonly formBuilder = inject(FormBuilder);
  private readonly tournamentService = inject(TournamentService);
  configurationForm: FormGroup = this.buildConfigurationForm();

  loading = signal<boolean>(false);
  availableGameFormats = toSignal(this.tournamentService.getGameFormats(), {initialValue: []});
  availableConfigurations = toSignal(this.tournamentService.getConfigurations(), {initialValue: []});
  gameFormatDurations = toSignal(this.tournamentService.getGameFormatDurations(), {initialValue: []});

  constructor() {
    this.configurationForm.get('game_format')?.valueChanges.subscribe(format => {
      const gameFormatDuration = this.gameFormatDurations()
        .find(item => item.format === format);
      if (gameFormatDuration) {
        this.configurationForm.patchValue({
          estimated_match_duration: gameFormatDuration.duration
        })
      }
    })
    effect(() => {
      const t = this.tournament();
      this.resetForm(t);
    });
  }

  private resetForm(tournament: Tournament): void {
    this.configurationForm.patchValue({
      game_format: tournament.game_format,
      configuration: tournament.configuration,
      estimated_match_duration: tournament.estimated_match_duration,
    });
    this.configurationForm.markAsUntouched();
  }

  private buildConfigurationForm(): FormGroup {
    return this.formBuilder.group({
      game_format: [null, [Validators.required]],
      configuration: ['TMC', [Validators.required]],
      estimated_match_duration: [null, [Validators.min(1), Validators.max(180)]],
    })
  }

  saveConfiguration(): void {
    if (this.configurationForm.invalid) return
    this.loading.set(true);
    const {game_format, configuration, estimated_match_duration} = this.configurationForm.value;
    const tournament = this.tournament();
    const input: TournamentRequest = {
      name: tournament.name,
      category: tournament.category,
      start_date: tournament.start_date,
      location: tournament.location,
      league: tournament.league,
      gender: tournament.gender,
      configuration: configuration,
      estimated_match_duration: estimated_match_duration,
      game_format: game_format,
    };
    this.tournamentService.updateTournament(tournament.id, input).subscribe({
      next: (response) => {
        this.tournament.set(response);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
