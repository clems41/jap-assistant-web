import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {TabsModule} from 'primeng/tabs';
import {MatchStatus, Tournament, TournamentStatus} from '../../../../shared/models/tournament.models';
import {Pair} from '../../../../shared/models/pair.models';
import {MatchListComponent} from './match-list/match-list.component';

@Component({
  selector: 'app-matchs',
  standalone: true,
  imports: [
    TabsModule,
    MatchListComponent
  ],
  templateUrl: './matchs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchsComponent {
  tournament = input.required<Tournament>();
  pairs = input.required<Pair[]>();
  refreshTrigger = input<number>(0);
  matchesChanged = output<void>();

  readonly startedStatuses: MatchStatus[] = [MatchStatus.STARTED];
  readonly upcomingStatuses: MatchStatus[] = [MatchStatus.UPCOMING];
  readonly finishedStatuses: MatchStatus[] = [MatchStatus.FINISHED];

  reorderEnabled = computed(() => this.tournament().status === TournamentStatus.STARTED);

  onRefreshNeeded(): void {
    this.matchesChanged.emit();
  }
}
