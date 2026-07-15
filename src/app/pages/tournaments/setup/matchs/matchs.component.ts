import {ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked} from '@angular/core';
import {TabsModule} from 'primeng/tabs';
import {BadgeModule} from 'primeng/badge';
import {Match, MatchStatus, Tournament, TournamentStatus} from '../../../../shared/models/tournament.models';
import {Pair} from '../../../../shared/models/pair.models';
import {MatchListComponent} from './match-list/match-list.component';
import {TournamentService} from '../../../../shared/services/tournament.service';

@Component({
  selector: 'app-matchs',
  standalone: true,
  imports: [
    TabsModule,
    BadgeModule,
    MatchListComponent
  ],
  templateUrl: './matchs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchsComponent {
  private readonly tournamentService = inject(TournamentService);

  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();
  refreshTrigger = input<number>(0);
  matchesChanged = output<void>();

  readonly startedStatuses: MatchStatus[] = [MatchStatus.STARTED];
  readonly upcomingStatuses: MatchStatus[] = [MatchStatus.UPCOMING];
  readonly finishedStatuses: MatchStatus[] = [MatchStatus.FINISHED];

  private allMatches = signal<Match[]>([]);

  totalCount = computed(() => this.allMatches().length);
  startedCount = computed(() => this.countByStatus(MatchStatus.STARTED));
  upcomingCount = computed(() => this.countByStatus(MatchStatus.UPCOMING));
  finishedCount = computed(() => this.countByStatus(MatchStatus.FINISHED));

  reorderEnabled = computed(() =>
    this.tournament().status === TournamentStatus.SET ||
    this.tournament().status === TournamentStatus.STARTED
  );

  constructor() {
    effect(() => {
      const tournamentId = this.tournament().id;
      this.refreshTrigger();
      untracked(() => this.refreshAllMatches(tournamentId));
    });
  }

  private refreshAllMatches(tournamentId: number): void {
    this.tournamentService.getMatches(tournamentId).subscribe({
      next: matches => this.allMatches.set(matches),
    });
  }

  private countByStatus(status: MatchStatus): number {
    return this.allMatches().filter(m => m.status === status).length;
  }

  onRefreshNeeded(): void {
    this.matchesChanged.emit();
  }
}
