import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {TagModule} from 'primeng/tag';
import {ButtonModule} from 'primeng/button';
import {Match, MatchStatus} from '../../../../../shared/models/tournament.models';
import {Pair} from '../../../../../shared/models/pair.models';
import {toFrenchDate} from '../../../../../shared/utils/date.utils';
import {formatPairName} from '../../../../../shared/utils/pair.utils';

@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [
    TagModule,
    ButtonModule
  ],
  templateUrl: './match-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchCardComponent {
  match = input.required<Match>();
  pair1 = input.required<Pair | undefined>();
  pair2 = input.required<Pair | undefined>();
  starting = input<boolean>(false);

  startRequested = output<number>();
  scoreRequested = output<number>();

  get accentColorClass(): string {
    if (this.bothPairsUndetermined) return 'bg-gris-30';
    switch (this.match().status) {
      case MatchStatus.STARTED:
        return 'bg-info-100';
      case MatchStatus.FINISHED:
        return 'bg-success-100';
      case MatchStatus.UPCOMING:
      default:
        return 'bg-secondary-100';
    }
  }

  get bothPairsUndetermined(): boolean {
    return !this.isPairDetermined(this.match().pair1) && !this.isPairDetermined(this.match().pair2);
  }

  get statusLabel(): string {
    switch (this.match().status) {
      case MatchStatus.STARTED:
        return 'En cours';
      case MatchStatus.FINISHED:
        return 'Terminé';
      case MatchStatus.UPCOMING:
      default:
        return 'À venir';
    }
  }

  get statusSeverity(): 'info' | 'secondary' | 'success' {
    switch (this.match().status) {
      case MatchStatus.STARTED:
        return 'info';
      case MatchStatus.FINISHED:
        return 'success';
      case MatchStatus.UPCOMING:
      default:
        return 'secondary';
    }
  }

  get isFinished(): boolean {
    return this.match().status === MatchStatus.FINISHED;
  }

  pairLabel(pair: Pair | undefined, pairId: number | null): string {
    return formatPairName(pair, pairId);
  }

  isPairDetermined(pairId: number | null): boolean {
    return !!pairId;
  }

  get canStart(): boolean {
    const match = this.match();
    return match.status === MatchStatus.UPCOMING
      && this.isPairDetermined(match.pair1)
      && this.isPairDetermined(match.pair2);
  }

  get canEnterScore(): boolean {
    const match = this.match();
    return this.isPairDetermined(match.pair1) && this.isPairDetermined(match.pair2);
  }

  get scoreButtonLabel(): string {
    return this.isFinished ? 'Modifier le score' : 'Saisir le score';
  }

  onStartClick(): void {
    this.startRequested.emit(this.match().id);
  }

  onScoreClick(): void {
    this.scoreRequested.emit(this.match().id);
  }

  isWinner(pair: Pair | undefined): boolean {
    const match = this.match();
    return this.isFinished && !!match.winner_id && !!pair && pair.id === match.winner_id;
  }

  protected readonly toFrenchDate = toFrenchDate;
}
