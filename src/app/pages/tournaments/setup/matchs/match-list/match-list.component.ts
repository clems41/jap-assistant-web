import {ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked} from '@angular/core';
import {CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';
import {TournamentService} from '../../../../../shared/services/tournament.service';
import {Match, MatchStatus, ReorderMatchesRequest, ScoreRequest, Tournament} from '../../../../../shared/models/tournament.models';
import {Pair} from '../../../../../shared/models/pair.models';
import {formatPairName} from '../../../../../shared/utils/pair.utils';
import {LoadingSpinnerComponent} from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import {MatchCardComponent} from '../match-card/match-card.component';
import {ScoreDialogComponent, ScoreSavedEvent} from '../../score-dialog/score-dialog.component';

@Component({
  selector: 'app-match-list',
  standalone: true,
  imports: [
    LoadingSpinnerComponent,
    MatchCardComponent,
    ScoreDialogComponent,
    DragDropModule,
  ],
  templateUrl: './match-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchListComponent {
  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();
  statuses = input.required<MatchStatus[]>();
  sortByFinishedAtDesc = input<boolean>(false);
  emptyStateLabel = input<string>('');
  refreshTrigger = input<number>(0);
  reorderable = input<boolean>(false);

  refreshNeeded = output<void>();

  private readonly tournamentService = inject(TournamentService);

  matches = signal<Match[]>([]);
  loading = signal(false);
  startingMatchId = signal<number | null>(null);
  selectedMatchForScore = signal<Match | null>(null);

  private pairsMap = computed(() => new Map(this.pairs().map(p => [p.id, p])));

  get scoreDialogPair1Name(): string {
    const match = this.selectedMatchForScore();
    return match ? formatPairName(this.getPair(match.pair1), match.pair1) : '';
  }

  get scoreDialogPair2Name(): string {
    const match = this.selectedMatchForScore();
    return match ? formatPairName(this.getPair(match.pair2), match.pair2) : '';
  }

  constructor() {
    effect(() => {
      const tournament = this.tournament();
      const statuses = this.statuses();
      this.refreshTrigger();
      untracked(() => this.refreshMatches(tournament.id, statuses));
    });
  }

  private refreshMatches(tournamentId: number, statuses: MatchStatus[]): void {
    this.loading.set(true);
    this.tournamentService.getMatches(tournamentId, statuses).subscribe({
      next: matches => {
        this.matches.set(this.sortByFinishedAtDesc() ? this.sortDesc(matches) : this.sortByOrder(matches));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private sortDesc(matches: Match[]): Match[] {
    return [...matches].sort((a, b) => new Date(b.finished_at).getTime() - new Date(a.finished_at).getTime());
  }

  private sortByOrder(matches: Match[]): Match[] {
    return [...matches].sort((a, b) => a.order - b.order);
  }

  getPair(pairId: number | null): Pair | undefined {
    return pairId == null ? undefined : this.pairsMap().get(pairId);
  }

  onStartRequested(matchId: number): void {
    this.startingMatchId.set(matchId);
    this.tournamentService.startMatch(this.tournament().id, matchId).subscribe({
      next: () => {
        this.startingMatchId.set(null);
        this.refreshNeeded.emit();
      },
      error: () => this.startingMatchId.set(null),
    });
  }

  onScoreRequested(matchId: number): void {
    this.selectedMatchForScore.set(this.matches().find(m => m.id === matchId) ?? null);
  }

  onScoreSaved(event: ScoreSavedEvent): void {
    const request: ScoreRequest = {score: event.score, winner_id: event.winnerId};
    this.tournamentService.updateMatchScore(this.tournament().id, event.matchId, request).subscribe({
      next: () => {
        this.selectedMatchForScore.set(null);
        this.refreshNeeded.emit();
      },
    });
  }

  onScoreDialogClosed(): void {
    this.selectedMatchForScore.set(null);
  }

  onDrop(event: CdkDragDrop<Match[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const previous = this.matches();
    const reordered = [...previous];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.matches.set(reordered);
    const request: ReorderMatchesRequest = { match_ids: reordered.map(m => m.id) };
    this.tournamentService.updateMatchesOrder(this.tournament().id, request).subscribe({
      next: updated => this.matches.set(updated),
      error: () => this.matches.set(previous),
    });
  }
}
