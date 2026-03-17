import {Component, model} from '@angular/core';
import {Tournament} from '../../../../shared/models/tournament.models';

@Component({
  selector: 'app-infos',
  imports: [],
  templateUrl: './infos.component.html'
})
export class InfosComponent {
  tournament = model.required<Tournament>();

}
