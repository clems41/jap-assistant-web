import {Component, input} from '@angular/core';
import {Bracket} from '../../../../../shared/models/tournament.models';

@Component({
  selector: 'app-bracket-chart',
  imports: [],
  templateUrl: './bracket-chart.component.html'
})
export class BracketChartComponent {
  bracket = input.required<Bracket>();

}
