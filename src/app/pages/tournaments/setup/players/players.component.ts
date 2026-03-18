import {ChangeDetectionStrategy, Component, input, model} from '@angular/core';
import {Tournament} from '../../../../shared/models/tournament.models';

@Component({
  selector: 'app-players',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './players.component.html'
})
export class PlayersComponent {
  tournament = input.required<Tournament>();
  loading = model.required<boolean>();

}
