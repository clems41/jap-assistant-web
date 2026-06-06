import {Component, inject, input, OnInit, signal} from '@angular/core';
import {Bracket, Tournament} from '../../../../shared/models/tournament.models';
import {EnumChoice} from '../../../../shared/models/base.models';
import {Pair} from '../../../../shared/models/pair.models';
import {TournamentService} from '../../../../shared/services/tournament.service';
import {GenerateBracketComponent} from './generate-bracket/generate-bracket.component';
import {BracketInfoComponent} from './bracket-info/bracket-info.component';
import {BracketChartComponent} from './bracket-chart/bracket-chart.component';

@Component({
  selector: 'app-brackets',
  imports: [
    GenerateBracketComponent,
    BracketInfoComponent,
    BracketChartComponent,
  ],
  templateUrl: './brackets.component.html'
})
export class BracketsComponent implements OnInit {
  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();
  availableGameFormats = input.required<EnumChoice[]>();

  private readonly tournamentService = inject(TournamentService);

  loading = signal<boolean>(false);
  bracket = signal<Bracket | null>(null);
  bracketAlreadyGenerated = signal<boolean>(false);

  ngOnInit() {
    this.loadBracket();
  }

  private loadBracket(): void {
    this.loading.set(true);
    const tournament = this.tournament();
    this.tournamentService.getTournamentBracket(tournament.id)
      .subscribe({
        next: bracket => {
          this.bracket.set(bracket);
          this.loading.set(false);
          this.bracketAlreadyGenerated.set(true);
        },
        error: () => this.loading.set(false)
      });
  }

  bracketHasBeenGenerated(bracket: Bracket): void {
    this.bracket.set(bracket);
    this.bracketAlreadyGenerated.set(true);
  }

}
