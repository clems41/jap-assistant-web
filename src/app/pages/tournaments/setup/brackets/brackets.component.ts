import {Component, inject, input, OnInit, output, signal} from '@angular/core';
import {Bracket, ScoreRequest, SeedingRequest, Tournament} from '../../../../shared/models/tournament.models';
import {EnumChoice} from '../../../../shared/models/base.models';
import {Pair} from '../../../../shared/models/pair.models';
import {TournamentService} from '../../../../shared/services/tournament.service';
import {GenerateBracketComponent} from './generate-bracket/generate-bracket.component';
import {BracketChartComponent} from './bracket-chart/bracket-chart.component';
import {ButtonModule} from 'primeng/button';
import {ConfirmationService} from 'primeng/api';

@Component({
  selector: 'app-brackets',
  imports: [
    GenerateBracketComponent,
    BracketChartComponent,
    ButtonModule,
  ],
  templateUrl: './brackets.component.html'
})
export class BracketsComponent implements OnInit {
  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();
  availableGameFormats = input.required<EnumChoice[]>();
  bracketChange = output<Bracket | null>();

  private readonly tournamentService = inject(TournamentService);
  private readonly confirmationService = inject(ConfirmationService);

  loading = signal<boolean>(false);
  bracket = signal<Bracket | null>(null);
  bracketAlreadyGenerated = signal<boolean>(false);

  ngOnInit() {
    this.loadBracket();
  }

  onScoreChanged(event: { matchId: number; score: string; winnerId: number }): void {
    const req: ScoreRequest = { score: event.score, winner_id: event.winnerId };
    this.tournamentService
      .updateMatchScore(this.tournament().id, event.matchId, req)
      .subscribe({ next: () => this.loadBracket() });
  }

  protected loadBracket(): void {
    this.loading.set(true);
    const tournament = this.tournament();
    this.tournamentService.getTournamentBracket(tournament.id)
      .subscribe({
        next: bracket => {
          this.bracket.set(bracket);
          this.bracketChange.emit(bracket);
          this.loading.set(false);
          this.bracketAlreadyGenerated.set(true);
        },
        error: () => this.loading.set(false)
      });
  }

  bracketHasBeenGenerated(bracket: Bracket): void {
    this.bracket.set(bracket);
    this.bracketChange.emit(bracket);
    this.bracketAlreadyGenerated.set(true);
  }

  onDeleteBracketRequested(): void {
    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir supprimer le tableau ? Cette action est irréversible.',
      header: 'Supprimer le tableau',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Annuler', severity: 'secondary', outlined: true },
      acceptButtonProps: { label: 'Supprimer', severity: 'danger' },
      accept: () => {
        this.tournamentService
          .deleteTournamentBracket(this.tournament().id)
          .subscribe({
            next: () => {
              this.bracket.set(null);
              this.bracketChange.emit(null);
              this.bracketAlreadyGenerated.set(false);
            }
          });
      },
    });
  }

  onSeedingChanged(req: SeedingRequest): void {
    this.tournamentService
      .updateBracketPlacement(this.tournament().id, req)
      .subscribe({ next: () => {
        this.loadBracket();
      }});
  }

  onScoreDeleteRequested(matchId: number): void {
    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir supprimer le score de ce match ? Cette action est irréversible.',
      header: 'Supprimer le score',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Annuler', severity: 'secondary', outlined: true },
      acceptButtonProps: { label: 'Supprimer', severity: 'danger' },
      accept: () => {
        this.tournamentService
          .deleteMatchScore(this.tournament().id, matchId)
          .subscribe({ next: () => this.loadBracket() });
      },
    });
  }

}
