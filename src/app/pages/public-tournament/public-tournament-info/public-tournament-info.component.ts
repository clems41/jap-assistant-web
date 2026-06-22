import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { TournamentStatus } from '../../../shared/models/tournament.models';
import { PublicTournament } from '../../../shared/models/public-tournament.models';
import { toFrenchDate } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-public-tournament-info',
  standalone: true,
  imports: [
    TagModule,
  ],
  templateUrl: './public-tournament-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicTournamentInfoComponent {
  tournament = input.required<PublicTournament>();

  get statusLabel(): string {
    switch (this.tournament().status) {
      case TournamentStatus.DRAFT:
        return 'Brouillon';
      case TournamentStatus.SET:
        return 'Configuré';
      case TournamentStatus.READY:
        return 'Prêt';
      case TournamentStatus.STARTED:
        return 'En cours';
      case TournamentStatus.FINISHED:
        return 'Terminé';
      default:
        return this.tournament().status;
    }
  }

  get statusSeverity(): 'secondary' | 'info' | 'success' {
    switch (this.tournament().status) {
      case TournamentStatus.DRAFT:
      case TournamentStatus.SET:
      case TournamentStatus.READY:
        return 'secondary';
      case TournamentStatus.STARTED:
        return 'info';
      case TournamentStatus.FINISHED:
        return 'success';
      default:
        return 'secondary';
    }
  }

  protected readonly toFrenchDate = toFrenchDate;
}
