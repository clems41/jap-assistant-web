import {Component, input} from '@angular/core';
import {Bracket} from '../../../../../shared/models/tournament.models';

@Component({
  selector: 'app-bracket-info',
  imports: [],
  templateUrl: './bracket-info.component.html'
})
export class BracketInfoComponent {
  bracket = input.required<Bracket>();

}
