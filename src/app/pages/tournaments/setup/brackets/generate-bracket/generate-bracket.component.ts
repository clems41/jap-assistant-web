import {Component, effect, inject, input, output, signal} from '@angular/core';
import {Bracket, GenerateBracketRequest, Tournament} from '../../../../../shared/models/tournament.models';
import {TournamentService} from '../../../../../shared/services/tournament.service';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Select} from 'primeng/select';
import {Button} from 'primeng/button';
import {LoadingSpinnerComponent} from '../../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-generate-bracket',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    Select,
    Button,
    LoadingSpinnerComponent
  ],
  templateUrl: './generate-bracket.component.html'
})
export class GenerateBracketComponent {
  tournament = input.required<Tournament>();
  bracket = output<Bracket>();

  private readonly tournamentService = inject(TournamentService);
  private readonly formBuilder = inject(FormBuilder);

  loading = signal<boolean>(false);
  private readonly allDimensions: number[] = [4, 8, 16, 32, 64];
  private readonly allNbTopSeeds: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  availableDimensions: number[] = [];
  availableNbTopSeeds: number[] = [];

  form: FormGroup = this.buildForm();

  constructor() {
    effect(() => {
      const tournament = this.tournament();
      this.availableDimensions = this.allDimensions.filter(dimension => dimension >= tournament.pairs_count);
      this.availableNbTopSeeds = this.allNbTopSeeds.filter(nbTopSeeds => nbTopSeeds >= tournament.pairs_count / 8 &&
        nbTopSeeds <= tournament.pairs_count / 2);
    });
  }

  private buildForm(): FormGroup {
    return this.formBuilder.group({
      dimension: [0, [Validators.required, Validators.min(4), Validators.max(64)]],
      nb_top_seeds: [0, [Validators.required, Validators.min(1), Validators.max(32)]]
    })
  }

  submit(): void {
    if (this.form.invalid) return
    this.loading.set(true);
    const input: GenerateBracketRequest = this.form.value as GenerateBracketRequest;
    this.tournamentService.generateTournamentBracket(this.tournament().id, input).subscribe({
      next: bracket => {
        this.loading.set(false);
        this.bracket.emit(bracket);
      },
      error: () => this.loading.set(false)
    })
  }
}
