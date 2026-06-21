import {ChangeDetectionStrategy, Component, input, signal} from '@angular/core';
import {TabsModule} from 'primeng/tabs';
import {MatchStatus, Tournament} from '../../../../shared/models/tournament.models';
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

  readonly startedStatuses: MatchStatus[] = [MatchStatus.STARTED];
  readonly upcomingStatuses: MatchStatus[] = [MatchStatus.UPCOMING];
  readonly finishedStatuses: MatchStatus[] = [MatchStatus.FINISHED];

  readonly refreshTrigger = signal(0);

  onRefreshNeeded(): void {
    this.refreshTrigger.update(value => value + 1);
  }
}
