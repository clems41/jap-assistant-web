import {Component, effect, inject, input, output, signal} from '@angular/core';
import {Bracket, GenerateBracketRequest, Tournament} from '../../../../../shared/models/tournament.models';
import {TournamentService} from '../../../../../shared/services/tournament.service';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors, ValidatorFn,
  Validators
} from '@angular/forms';
import {SelectModule} from 'primeng/select';
import {ButtonModule} from 'primeng/button';
import {LoadingSpinnerComponent} from '../../../../../shared/components/loading-spinner/loading-spinner.component';

class RoundVisible {
  round64: boolean = false;
  round32: boolean = false;
  round16: boolean = false;
  round8: boolean = false;
  round4: boolean = false;
}

@Component({
  selector: 'app-generate-bracket',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SelectModule,
    ButtonModule,
    LoadingSpinnerComponent,
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
  private readonly allowedPairCountValueToGenerateBracket: number[] = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64];
  availableDimensions: number[] = [];
  availableNbPairRound: number[] = [0, 2, 4, 8, 16, 32, 64];

  inputRoundVisible: RoundVisible = new RoundVisible();

  form: FormGroup = this.formBuilder.group({});
  private previousDimension: number | null = null;

  constructor() {
    effect(() => {
      const tournament = this.tournament();
      this.availableDimensions = this.allDimensions.filter(dimension => dimension >= tournament.pairs_count);
      this.form = this.buildForm(tournament);
      this.previousDimension = this.form.value.dimension;
      this.form?.valueChanges.subscribe(value => this.onFormValueChange(value, tournament.pairs_count));
    });
  }

  get canGenerateBracket(): boolean {
    return this.allowedPairCountValueToGenerateBracket.includes(this.tournament()?.pairs_count);
  }

  get nbPairNeededToGenerateBracket(): number {
    if (this.canGenerateBracket) return 0
    for (const allowedPairCount of this.allowedPairCountValueToGenerateBracket) {
      if (allowedPairCount > this.tournament()?.pairs_count) return allowedPairCount - this.tournament()?.pairs_count
    }
    return 0
  }

  private buildForm(tournament: Tournament): FormGroup {
    return this.formBuilder.group({
      dimension: [0, [Validators.required, Validators.min(4), Validators.max(64)]],
      nb_pair_round_64: [0, [Validators.required, Validators.min(0), Validators.max(Math.min(tournament.pairs_count, 64))]],
      nb_pair_round_32: [0, [Validators.required, Validators.min(0), Validators.max(Math.min(tournament.pairs_count, 32))]],
      nb_pair_round_16: [0, [Validators.required, Validators.min(0), Validators.max(Math.min(tournament.pairs_count, 16))]],
      nb_pair_round_8: [0, [Validators.required, Validators.min(0), Validators.max(Math.min(tournament.pairs_count, 8))]],
      nb_pair_round_4: [0, [Validators.required, Validators.min(0), Validators.max(Math.min(tournament.pairs_count, 4))]],
    }, { validators: this.nbPairRoundMismatchPairCount(tournament.pairs_count) })
  }

  private nbPairRoundMismatchPairCount(pair_count: number): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const {nb_pair_round_64, nb_pair_round_32, nb_pair_round_16, nb_pair_round_8, nb_pair_round_4} = group?.value;
      const nb_pair_round: number = nb_pair_round_64 + nb_pair_round_32 + nb_pair_round_16 + nb_pair_round_8 + nb_pair_round_4
      return nb_pair_round === pair_count ? null : {nbPairRoundMismatchPairCount: true};
    }
  }

  private onFormValueChange(value: any, pair_count: number): void {
    if (value.dimension !== this.previousDimension) {
      this.previousDimension = value.dimension;
      this.form.patchValue({
        nb_pair_round_64: 0,
        nb_pair_round_32: 0,
        nb_pair_round_16: 0,
        nb_pair_round_8: 0,
        nb_pair_round_4: 0,
      }, {emitEvent: false});
      value = this.form.value;
    }
    this.updateRoundVisible(value, pair_count);
  }

  private updateRoundVisible(value: any, pair_count: number): void {
    const {dimension, nb_pair_round_64, nb_pair_round_32, nb_pair_round_16, nb_pair_round_8} = value;
    const pair_round_before_32 = nb_pair_round_64;
    const pair_round_before_16 = pair_round_before_32 + nb_pair_round_32;
    const pair_round_before_8 = pair_round_before_16 + nb_pair_round_16;
    const pair_round_before_4 = pair_round_before_8 + nb_pair_round_8;
    this.inputRoundVisible = {
      round64: dimension === 64,
      round32: dimension === 32 || (dimension > 32 && nb_pair_round_64 > 0 && pair_round_before_32 < pair_count),
      round16: dimension === 16 || (dimension > 16 && nb_pair_round_32 > 0 && pair_round_before_16 < pair_count),
      round8: dimension === 8 || (dimension > 8 && nb_pair_round_16 > 0 && pair_round_before_8 < pair_count),
      round4: dimension === 4 || (dimension > 4 && nb_pair_round_8 > 0 && pair_round_before_4 < pair_count),
    }
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
