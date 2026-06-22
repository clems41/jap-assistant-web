import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked, WritableSignal } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { Match, MatchStatus } from '../../../shared/models/tournament.models';
import { Pair } from '../../../shared/models/pair.models';
import { PublicTournamentService } from '../../../shared/services/public-tournament.service';
import { mapPublicMatch } from '../../../shared/utils/public-tournament.utils';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { MatchCardComponent } from '../../tournaments/setup/matchs/match-card/match-card.component';

interface MappedMatch {
  match: Match;
  pair1: Pair | undefined;
  pair2: Pair | undefined;
}

@Component({
  selector: 'app-public-tournament-matches',
  standalone: true,
  imports: [
    TabsModule,
    LoadingSpinnerComponent,
    MatchCardComponent,
  ],
  templateUrl: './public-tournament-matches.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicTournamentMatchesComponent {
  code = input.required<string>();

  private readonly publicTournamentService = inject(PublicTournamentService);

  readonly startedMatches = signal<MappedMatch[]>([]);
  readonly upcomingMatches = signal<MappedMatch[]>([]);
  readonly finishedMatches = signal<MappedMatch[]>([]);

  readonly startedLoading = signal(false);
  readonly upcomingLoading = signal(false);
  readonly finishedLoading = signal(false);

  constructor() {
    effect(() => {
      const code = this.code();
      untracked(() => {
        this.refreshStatus(code, MatchStatus.STARTED, this.startedMatches, this.startedLoading, false);
        this.refreshStatus(code, MatchStatus.UPCOMING, this.upcomingMatches, this.upcomingLoading, false);
        this.refreshStatus(code, MatchStatus.FINISHED, this.finishedMatches, this.finishedLoading, true);
      });
    });
  }

  private refreshStatus(
    code: string,
    status: MatchStatus,
    target: WritableSignal<MappedMatch[]>,
    loading: WritableSignal<boolean>,
    sortByFinishedAtDesc: boolean,
  ): void {
    loading.set(true);
    this.publicTournamentService.getPublicMatches(code, [status]).subscribe({
      next: matches => {
        const mapped = matches.map(mapPublicMatch);
        target.set(sortByFinishedAtDesc ? this.sortDesc(mapped) : mapped);
        loading.set(false);
      },
      error: () => loading.set(false),
    });
  }

  private sortDesc(matches: MappedMatch[]): MappedMatch[] {
    return [...matches].sort(
      (a, b) => new Date(b.match.finished_at).getTime() - new Date(a.match.finished_at).getTime(),
    );
  }
}
